"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/store/auth-store"
import { 
  Upload, 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Loader2,
  Volume2,
  Sparkles,
  FileAudio,
  History,
  Check,
  X,
  RefreshCw,
  CheckCircle2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { VoiceClone, NarrationHistory } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dropzone } from "@/components/ui/dropzone"
import { supabase } from "@/lib/supabase/client"

export default function VoicesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Upload states
  const [audioFiles, setAudioFiles] = useState<File[]>([]) // Múltiplos áudios
  const [audioDurations, setAudioDurations] = useState<number[]>([]) // Durações dos áudios
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0) // Índice do áudio atual (0 = primeiro, 1 = segundo, etc.)
  const [validatingDuration, setValidatingDuration] = useState(false)
  const [voiceName, setVoiceName] = useState("")
  const [voiceDescription, setVoiceDescription] = useState("")
  const [currentStep, setCurrentStep] = useState<1 | 2>(1) // Passo atual (1 = detalhes, 2 = amostras)
  const [testText, setTestText] = useState("") // Texto de teste durante clone

  // Teste de voz durante clone
  const [testingVoice, setTestingVoice] = useState<any | null>(null) // Voz temporária em teste
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null)
  const [testAudioPlaying, setTestAudioPlaying] = useState(false)
  const [generatingTest, setGeneratingTest] = useState(false)
  const testAudioRef = useRef<HTMLAudioElement>(null)
  const [activeTab, setActiveTab] = useState("upload")

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Apenas verificar autenticação
    if (!isAuthenticated) {
      toast({
        title: "Não autenticado",
        description: "Faça login para acessar esta página",
        variant: "destructive",
      })
    }
  }, [isAuthenticated])

  // Funções de carregamento de vozes removidas - não são mais necessárias nesta página

  // Função auxiliar para obter duração do áudio
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const url = URL.createObjectURL(file)
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url)
        resolve(audio.duration)
      })
      
      audio.addEventListener('error', (e) => {
        URL.revokeObjectURL(url)
        reject(new Error('Erro ao carregar áudio'))
      })
      
      audio.src = url
    })
  }

  // Selecionar áudio individual (um por vez) via drag-and-drop
  const handleFilesDropped = async (files: File[]) => {
    if (files.length === 0) return
    
    // Pegar apenas o primeiro arquivo (um por vez)
    const file = files[0]
    await processAudioFile(file)
  }

  // Selecionar áudio individual (um por vez) via input file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      await processAudioFile(file)
    }
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  // Processar um arquivo de áudio individual
  const processAudioFile = async (file: File) => {
    try {
      setValidatingDuration(true)
      
      // Validar tipo
      const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Arquivo inválido",
          description: "Use arquivos WAV, MP3, WEBM ou OGG",
          variant: "destructive",
        })
        setValidatingDuration(false)
        return
      }

      // Validar tamanho (32MB como no Fish Audio)
      const maxSize = 32 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "Tamanho máximo: 32MB",
          variant: "destructive",
        })
        setValidatingDuration(false)
        return
      }

      // Obter duração
      try {
        const duration = await getAudioDuration(file)
        
        // Validar duração (20-50 segundos)
        if (duration < 20) {
          toast({
            title: "Áudio muito curto",
            description: `Áudio tem ${Math.round(duration)}s. Mínimo: 20 segundos`,
            variant: "destructive",
          })
          setValidatingDuration(false)
          return
        }
        
        if (duration > 50) {
          toast({
            title: "Áudio muito longo",
            description: `Áudio tem ${Math.round(duration)}s. Máximo: 50 segundos`,
            variant: "destructive",
          })
          setValidatingDuration(false)
          return
        }

        // Adicionar áudio à lista
        const newFiles = [...audioFiles, file]
        const newDurations = [...audioDurations, duration]
        
        setAudioFiles(newFiles)
        setAudioDurations(newDurations)
        setCurrentAudioIndex(newFiles.length) // Avançar para o próximo índice
        
        // Sugerir nome baseado no primeiro arquivo
        if (!voiceName && newFiles.length === 1) {
          const fileName = file.name.replace(/\.[^/.]+$/, "")
          setVoiceName(fileName)
        }

        // Feedback positivo
        toast({
          title: "Áudio adicionado!",
          description: `${file.name} (${Math.round(duration)}s) adicionado com sucesso`,
        })

        // Se ainda não tem 2 áudios, pedir o próximo
        if (newFiles.length === 1) {
          toast({
            title: "Adicione mais um áudio",
            description: "Para melhor qualidade, adicione um segundo áudio de referência",
          })
        }
      } catch (error) {
        toast({
          title: "Erro ao processar áudio",
          description: "Não foi possível ler o arquivo de áudio",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo de áudio",
        variant: "destructive",
      })
    } finally {
      setValidatingDuration(false)
    }
  }

  const handleUpload = async () => {
    if (audioFiles.length < 2) {
      toast({
        title: "Áudios necessários",
        description: "Selecione pelo menos 2 arquivos de áudio (20-50 segundos cada)",
        variant: "destructive",
      })
      return
    }

    if (audioFiles.length > 3) {
      toast({
        title: "Muitos arquivos",
        description: "Selecione no máximo 3 arquivos de áudio",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      
      // Verificar autenticação ANTES de criar FormData
      if (!isAuthenticated || !user) {
        toast({
          title: "Não autenticado",
          description: "Faça login para continuar",
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      // 🚨 MODO DESENVOLVIMENTO: Tentar usar API key do Fish primeiro (se configurada)
      const fishApiKey = process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY
      const useFishApiKey = !!fishApiKey
      
      // Obter token de acesso do Supabase (se não estiver usando modo desenvolvimento)
      let session = null
      if (!useFishApiKey) {
        const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (!supabaseSession || sessionError) {
          console.error('❌ Erro ao obter sessão:', sessionError)
          toast({
            title: "Sessão expirada",
            description: "Faça login novamente ou configure NEXT_PUBLIC_FISH_AUDIO_API_KEY para modo desenvolvimento",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        if (!supabaseSession.access_token) {
          console.error('❌ Sessão não tem access_token')
          toast({
            title: "Erro de autenticação",
            description: "Faça login novamente",
            variant: "destructive",
          })
          setUploading(false)
          return
        }
        
        session = supabaseSession
      } else {
        console.log('⚠️ MODO DESENVOLVIMENTO: Usando API key do Fish (sem autenticação Supabase)')
      }

      // Verificar saldo antes de fazer upload (apenas se não estiver em modo desenvolvimento)
      if (!useFishApiKey && session?.access_token) {
        const balanceResponse = await fetch('/api/credits', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          credentials: 'include',
        })

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          const currentBalance = balanceData.balance?.balance || balanceData.balance || 0
          const creditsRequired = 50 // 50 créditos para criar voz

          if (currentBalance < creditsRequired) {
            toast({
              title: "Saldo insuficiente",
              description: `Você precisa de ${creditsRequired} créditos para criar uma voz. Seu saldo atual: ${currentBalance} créditos.`,
              variant: "destructive",
              duration: 8000,
            })
            setUploading(false)
            return
          }
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível verificar seu saldo. Tente novamente.",
            variant: "destructive",
          })
          setUploading(false)
          return
        }
      }
      
      const formData = new FormData()
      
      // Enviar múltiplos áudios
      audioFiles.forEach((file, index) => {
        formData.append(`audio${index}`, file)
      })
      formData.append('audioCount', audioFiles.length.toString())
      
      formData.append('name', voiceName || `Voz ${new Date().toLocaleDateString('pt-BR')}`)
      if (voiceDescription) {
        formData.append('description', voiceDescription)
      }
      if (testText.trim()) {
        formData.append('testText', testText.trim()) // Enviar texto de teste se houver
      }

      // Preparar headers
      const headers: HeadersInit = {}
      
      if (useFishApiKey) {
        // Modo desenvolvimento: usar API key do Fish
        headers['x-fish-api-key'] = fishApiKey
        console.log('   ✅ Enviando header x-fish-api-key')
      } else if (session?.access_token) {
        // Modo normal: usar token do Supabase
        headers['Authorization'] = `Bearer ${session.access_token}`
        console.log('   ✅ Enviando token do Supabase')
      }

      console.log('📤 Fazendo upload de áudio...')
      const response = await fetch('/api/voices/create-voice', {
        method: 'POST',
        credentials: 'include', // Incluir cookies na requisição
        headers,
        body: formData,
      })
      
      console.log('📥 Resposta recebida:', response.status, response.statusText)

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Não autenticado")
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || errorData.details || `Erro ${response.status}`
        const errorHint = errorData.hint || ""
        const errorCode = errorData.errorCode || ""
        
        console.error('❌ Erro ao fazer upload:', {
          status: response.status,
          error: errorMessage,
          details: errorData.details,
          hint: errorHint,
          errorCode,
          fullError: errorData
        })
        
        // Se o erro mencionar migration, verificar se já foi executada
        let description = errorMessage
        if (errorHint) {
          if (errorHint.includes('migration') || errorHint.includes('005_add_audio_urls')) {
            description = `${errorMessage}\n\n💡 ${errorHint}\n\n✅ Se você já executou a migration, tente:\n1. Recarregar a página (F5)\n2. Verificar se a coluna audio_urls existe no Supabase`
          } else {
            description = `${errorMessage}\n\n💡 ${errorHint}`
          }
        }
        
        toast({
          title: "Erro ao criar voz",
          description: description,
          variant: "destructive",
          duration: 10000, // Mostrar por 10 segundos
        })
        
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.success) {
        // Mostrar aviso se houver warning (ex: migration não executada)
        if (data.warning) {
          toast({
            title: "Aviso",
            description: data.warning,
            variant: "default",
          })
        }
        
        // Se tiver texto de teste, gerar narração de teste
        if (testText.trim() && data.voiceClone) {
          setTestingVoice(data.voiceClone)
          await generateTestNarration(data.voiceClone, testText.trim())
        } else {
          // Se não tiver texto de teste, salvar diretamente
          toast({
            title: "Sucesso!",
            description: "Voz clonada com sucesso!",
          })
          
          // Limpar formulário
          setAudioFiles([])
          setAudioDurations([])
          setVoiceName("")
          setVoiceDescription("")
          setTestText("")
          
          // Recarregar vozes
          await loadVoices()
        }
      } else {
        const errorMessage = data.error || data.message || "Erro ao criar clone de voz"
        const errorDetails = data.details || data.hint || ""
        
        toast({
          title: "Erro",
          description: errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload:', error)
      
      // Se o erro já foi tratado acima, não mostrar novamente
      if (error.message && error.message !== "Erro ao processar áudio") {
        return
      }
      
      toast({
        title: "Erro",
        description: error.message || error.toString() || "Erro ao processar áudio. Verifique o console para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleGenerate = async () => {
    // 🔐 VERIFICAR AUTENTICAÇÃO PRIMEIRO (antes de qualquer coisa)
    if (!isAuthenticated || !user) {
      toast({
        title: "Não autenticado",
        description: "Faça login para gerar vozes",
        variant: "destructive",
      })
      return
    }

    if (!selectedVoice || !text.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma voz e digite um texto",
        variant: "destructive",
      })
      return
    }

    try {
      setGenerating(true)
      setGeneratedAudioUrl(null)

      const voiceClone = voices.find(v => v.id === selectedVoice)
      if (!voiceClone) return

      // 🔐 VERIFICAR SESSÃO ANTES DE FAZER A REQUISIÇÃO
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar",
          variant: "destructive",
        })
        setGenerating(false)
        return
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Adicionar token no header (obrigatório)
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Token de acesso não encontrado. Faça login novamente.",
          variant: "destructive",
        })
        setGenerating(false)
        return
      }

      const response = await fetch('/api/voices/generate-tts', {
        method: 'POST',
        credentials: 'include', // Incluir cookies na requisição
        headers,
        body: JSON.stringify({
          voiceId: voiceClone.voiceId,
          voiceCloneId: voiceClone.id,
          text: text.trim(),
          model: selectedModel, // Modelo selecionado (s1 ou speech-1.5)
          speed: speed, // Velocidade: 0.7 a 1.3 (padrão: 1.0)
          volume: volume, // Volume: -10 a 10 (padrão: 0)
          temperature: temperature, // Temperatura: 0.0 a 1.0 (padrão: 0.9)
          topP: topP, // Top-p: 0.0 a 1.0 (padrão: 0.9)
          language: language === 'auto' ? undefined : language, // Idioma: 'auto' = detectar do áudio (preserva sotaque moçambicano)
          format: 'mp3',
        }),
      })

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Não autenticado")
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Mostrar erro detalhado
        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}`
        const errorDetails = errorData.details || errorData.hint || ""
        const errorCode = errorData.errorCode || ""
        
        // Mensagem completa com detalhes
        const fullErrorMessage = errorDetails 
          ? `${errorMessage}\n\n${errorDetails}`
          : errorMessage
        
        console.error('❌ Erro ao gerar TTS:', {
          status: response.status,
          error: errorMessage,
          details: errorDetails,
          errorCode,
          fullError: errorData
        })
        
        toast({
          title: "Erro ao gerar narração",
          description: fullErrorMessage,
          variant: "destructive",
        })
        
        throw new Error(fullErrorMessage)
      }

      const data = await response.json()

      if (data.success) {
        setGeneratedAudioUrl(data.audioUrl)
        toast({
          title: "Sucesso!",
          description: data.cached 
            ? "Áudio recuperado do cache" 
            : "Narração gerada com sucesso!",
        })
        
        // Recarregar histórico após gerar narração
        console.log('🔄 Recarregando histórico após gerar narração...')
        await loadHistory()
      } else {
        const errorMessage = data.error || data.message || "Erro ao gerar narração"
        const errorDetails = data.details || data.hint || ""
        
        toast({
          title: "Erro",
          description: errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('❌ Erro ao gerar TTS:', error)
      
      // Se o erro já foi tratado acima, não mostrar novamente
      if (error.message && error.message !== "Erro ao gerar narração") {
        return
      }
      
      toast({
        title: "Erro",
        description: error.message || error.toString() || "Erro ao gerar narração. Verifique o console para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (voiceId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta voz?')) {
      return
    }

    try {
      // Obter token para enviar no header
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {}
      
      // Adicionar token no header se disponível
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/voices/${voiceId}`, {
        method: 'DELETE',
        credentials: 'include', // Incluir cookies na requisição
        headers,
      })

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Não autenticado")
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: "Voz deletada com sucesso",
        })
        await loadVoices()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao deletar voz",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao deletar voz:', error)
      toast({
        title: "Erro",
        description: "Erro ao deletar voz",
        variant: "destructive",
      })
    }
  }

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setAudioPlaying(!audioPlaying)
    }
  }

  const handleDownload = () => {
    if (generatedAudioUrl && audioRef.current) {
      const a = document.createElement('a')
      a.href = generatedAudioUrl
      a.download = `narracao-${Date.now()}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  // Carregar histórico de narrações
  const loadHistory = async () => {
    try {
      setLoadingHistory(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/voices/history', {
        method: 'GET',
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        console.error('❌ Erro ao buscar histórico:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Detalhes do erro:', errorData)
        return
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Histórico carregado:', data.narrations?.length || 0, 'narrações')
        setNarrations(data.narrations || [])
      } else {
        console.error('❌ Resposta sem sucesso:', data)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Gerar narração de teste durante clone
  const generateTestNarration = async (voiceClone: any, testText: string) => {
    // 🔐 VERIFICAR AUTENTICAÇÃO PRIMEIRO
    if (!isAuthenticated || !user) {
      toast({
        title: "Não autenticado",
        description: "Faça login para gerar vozes",
        variant: "destructive",
      })
      return
    }

    try {
      setGeneratingTest(true)
      setTestAudioUrl(null)

      // 🔐 VERIFICAR SESSÃO ANTES DE FAZER A REQUISIÇÃO
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar",
          variant: "destructive",
        })
        setGeneratingTest(false)
        return
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Adicionar token no header (obrigatório)
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Token de acesso não encontrado. Faça login novamente.",
          variant: "destructive",
        })
        setGeneratingTest(false)
        return
      }

      const response = await fetch('/api/voices/generate-tts', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          voiceId: voiceClone.voiceId,
          voiceCloneId: voiceClone.id,
          text: testText,
          format: 'mp3',
          skipSave: true, // Não salvar no histórico ainda (só teste)
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTestAudioUrl(data.audioUrl)
        }
      }
    } catch (error) {
      console.error('Erro ao gerar teste:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar narração de teste",
        variant: "destructive",
      })
    } finally {
      setGeneratingTest(false)
    }
  }

  // Aprovar voz após teste
  const handleApproveVoice = async () => {
    if (!testingVoice) return

    try {
      setUploading(true)
      
      // A voz já foi salva durante o upload, apenas confirmamos a aprovação
      // Limpar estados de teste primeiro
      const voiceId = testingVoice.id
      setTestingVoice(null)
      setTestAudioUrl(null)
      setTestText("")
      setAudioFiles([])
      setAudioDurations([])
      setVoiceName("")
      setVoiceDescription("")
      
      // Recarregar vozes para atualizar a lista
      await loadVoices()
      
      toast({
        title: "Sucesso!",
        description: "Voz aprovada e salva com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao aprovar voz:', error)
      // Não mostrar erro se a voz já foi salva - apenas logar
      toast({
        title: "Voz salva",
        description: "A voz foi salva com sucesso. Você pode encontrá-la na lista de vozes.",
      })
    } finally {
      setUploading(false)
    }
  }

  // Descartar voz (já foi salva no upload, mas podemos deletar)
  const handleDiscardVoice = async () => {
    if (!testingVoice || !confirm('Tem certeza que deseja descartar esta voz? Ela será removida.')) {
      return
    }

    try {
      // Deletar voz temporária
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      await fetch(`/api/voices/${testingVoice.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      })

      toast({
        title: "Voz descartada",
        description: "A voz foi removida",
      })
      
      // Limpar estados
      setTestingVoice(null)
      setTestAudioUrl(null)
      setTestText("")
      setAudioFiles([])
      setAudioDurations([])
      setVoiceName("")
      setVoiceDescription("")
    } catch (error) {
      console.error('Erro ao descartar voz:', error)
    }
  }

  // Remover áudio da lista
  const handleRemoveAudio = (index: number) => {
    const newFiles = [...audioFiles]
    const newDurations = [...audioDurations]
    newFiles.splice(index, 1)
    newDurations.splice(index, 1)
    setAudioFiles(newFiles)
    setAudioDurations(newDurations)
    
    // Ajustar índice atual se necessário
    if (currentAudioIndex > newFiles.length - 1) {
      setCurrentAudioIndex(newFiles.length)
    }
  }

  // Regenerar teste
  const handleRegenerateTest = async () => {
    if (!testingVoice || !testText.trim()) return
    await generateTestNarration(testingVoice, testText.trim())
  }

  // Toggle áudio de teste
  const toggleTestAudio = () => {
    if (testAudioRef.current) {
      if (testAudioPlaying) {
        testAudioRef.current.pause()
      } else {
        testAudioRef.current.play()
      }
      setTestAudioPlaying(!testAudioPlaying)
    }
  }

  // Deletar narração do histórico
  const handleDeleteNarration = async (narrationId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta narração do histórico?')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/voices/history/${narrationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      })

      if (response.ok) {
        toast({
          title: "Narração removida",
          description: "A narração foi removida do histórico",
        })
        await loadHistory()
      } else {
        throw new Error('Erro ao deletar narração')
      }
    } catch (error) {
      console.error('Erro ao deletar narração:', error)
      toast({
        title: "Erro",
        description: "Erro ao deletar narração",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Construir uma nova voz</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/voices/history')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Histórico de Gerações
          </Button>
        </div>

        {/* Indicador de Etapas */}
        <div className="flex items-center gap-4 border-b pb-4">
          <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep === 1 ? 'border-primary bg-primary/10' : 'border-border'}`}>
              {currentStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
            </div>
            <span className="font-medium">Passo 1 Detalhe da voz</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep === 2 ? 'border-primary bg-primary/10' : 'border-border'}`}>
              2
            </div>
            <span className="font-medium">Passo 2 Amostras de áudio</span>
          </div>
        </div>

        {/* Formulário */}
        <div className="space-y-6">
          {/* Passo 1: Detalhes da Voz */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhe da voz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="voice-name">Nome</Label>
                  <Input
                    id="voice-name"
                    placeholder="Introduzir nome de voz"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                {/* Descrição (opcional) */}
                <div className="space-y-2">
                  <Label htmlFor="voice-description">Descrição (opcional)</Label>
                  <Textarea
                    id="voice-description"
                    placeholder="Descrição da voz..."
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    disabled={uploading}
                    rows={3}
                  />
                </div>

                {/* Botão Próximo Passo */}
                <Button
                  onClick={async () => {
                    // Verificar saldo antes de continuar
                    if (!user) {
                      toast({
                        title: "Não autenticado",
                        description: "Faça login para criar uma voz",
                        variant: "destructive",
                      })
                      return
                    }

                    try {
                      const { data: { session } } = await supabase.auth.getSession()
                      if (!session?.access_token) {
                        toast({
                          title: "Erro de autenticação",
                          description: "Faça login novamente",
                          variant: "destructive",
                        })
                        return
                      }

                      // Verificar saldo
                      const balanceResponse = await fetch('/api/credits', {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                        },
                        credentials: 'include',
                      })

                      if (balanceResponse.ok) {
                        const balanceData = await balanceResponse.json()
                        const currentBalance = balanceData.balance?.balance || balanceData.balance || 0
                        const creditsRequired = 50 // 50 créditos para criar voz

                        if (currentBalance < creditsRequired) {
                          toast({
                            title: "Saldo insuficiente",
                            description: `Você precisa de ${creditsRequired} créditos para criar uma voz. Seu saldo atual: ${currentBalance} créditos.`,
                            variant: "destructive",
                            duration: 8000,
                          })
                          return
                        }
                      }

                      // Se tem saldo suficiente, continuar para passo 2
                      setCurrentStep(2)
                    } catch (error: any) {
                      console.error('Erro ao verificar saldo:', error)
                      toast({
                        title: "Erro",
                        description: "Não foi possível verificar seu saldo. Tente novamente.",
                        variant: "destructive",
                      })
                    }
                  }}
                  disabled={!voiceName.trim()}
                  className="w-full"
                  size="lg"
                >
                  Continuar para Passo 2
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Passo 2: Amostras de Áudio */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Passo 2 Amostras de áudio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tabs: Carregar / Registo */}
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList>
                    <TabsTrigger value="upload">Carregar</TabsTrigger>
                    <TabsTrigger value="record">Registo</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="space-y-4 mt-4">
                    {/* Área de Drag and Drop */}
                    {audioFiles.length < 3 && (
                      <div className="space-y-4">
                        {audioFiles.length === 0 && (
                          <div>
                            <Label className="text-base font-semibold mb-2 block">
                              1️⃣ Primeiro Áudio de Referência
                            </Label>
                            <Dropzone
                              onDrop={handleFilesDropped}
                              accept="audio/*"
                              disabled={uploading || validatingDuration}
                              className="min-h-[200px]"
                            >
                              <div className="flex flex-col items-center justify-center p-8 text-center">
                                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium mb-1">
                                  Adicione ou largue os seus ficheiros áudio
                                </p>
                                <p className="text-xs text-muted-foreground">Max file size: 32 MB</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Duração recomendada: 20-50 segundos
                                </p>
                              </div>
                            </Dropzone>
                            <Input
                              type="file"
                              accept="audio/*"
                              onChange={handleFileChange}
                              disabled={uploading || validatingDuration}
                              className="hidden"
                              id="audio-file-input-0"
                            />
                          </div>
                        )}

                        {audioFiles.length === 1 && (
                          <div>
                            <Label className="text-base font-semibold mb-2 block">
                              2️⃣ Segundo Áudio de Referência (Recomendado)
                            </Label>
                            <p className="text-sm text-muted-foreground mb-4">
                              Para melhor qualidade, adicione um segundo áudio (20-50 segundos)
                            </p>
                            <Dropzone
                              onDrop={handleFilesDropped}
                              accept="audio/*"
                              disabled={uploading || validatingDuration}
                              className="min-h-[200px]"
                            >
                              <div className="flex flex-col items-center justify-center p-8 text-center">
                                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium mb-1">
                                  Adicione ou largue o segundo ficheiro áudio
                                </p>
                                <p className="text-xs text-muted-foreground">Max file size: 32 MB</p>
                              </div>
                            </Dropzone>
                          </div>
                        )}

                        {audioFiles.length === 2 && (
                          <div>
                            <Label className="text-base font-semibold mb-2 block">
                              3️⃣ Terceiro Áudio de Referência (Opcional)
                            </Label>
                            <p className="text-sm text-muted-foreground mb-4">
                              Opcional: adicione um terceiro áudio para máxima qualidade (20-50 segundos)
                            </p>
                            <Dropzone
                              onDrop={handleFilesDropped}
                              accept="audio/*"
                              disabled={uploading || validatingDuration}
                              className="min-h-[200px]"
                            >
                              <div className="flex flex-col items-center justify-center p-8 text-center">
                                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium mb-1">
                                  Adicione ou largue o terceiro ficheiro áudio
                                </p>
                                <p className="text-xs text-muted-foreground">Max file size: 32 MB</p>
                              </div>
                            </Dropzone>
                          </div>
                        )}

                        {validatingDuration && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Validando áudio...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lista de áudios selecionados */}
                    {audioFiles.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Áudios selecionados ({audioFiles.length}/3)
                          </p>
                          {audioFiles.length >= 2 && (
                            <Badge variant="default" className="text-xs">
                              ✓ Pronto para clonar
                            </Badge>
                          )}
                        </div>
                        
                        {audioFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-4 bg-muted rounded-lg border-2 border-border"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                              {index + 1}
                            </div>
                            <FileAudio className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium block truncate">
                                {file.name}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </Badge>
                                {audioDurations[index] && (
                                  <Badge 
                                    variant={audioDurations[index] >= 20 && audioDurations[index] <= 50 ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {Math.round(audioDurations[index])}s
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  ✓ Válido
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAudio(index)}
                              disabled={uploading || validatingDuration}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Texto de Teste (opcional) */}
                    <div className="space-y-2">
                      <Label htmlFor="test-text">Texto de Teste (opcional)</Label>
                      <Textarea
                        id="test-text"
                        placeholder="Digite um texto para testar a voz após clonar..."
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        disabled={uploading}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Se preenchido, uma narração de teste será gerada após o upload para você ouvir antes de salvar
                      </p>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={audioFiles.length < 2 || audioFiles.length > 3 || uploading || validatingDuration}
                        className="flex-1"
                        size="lg"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Criar Voz
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="record" className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center py-12">
                          <Mic className="h-12 w-12 mx-auto mb-4 text-primary" />
                          <p className="text-lg font-semibold mb-2">Gravação de Áudio</p>
                          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Para clonar sua voz, você precisa fazer upload de arquivos de áudio. 
                            Use a aba &quot;Upload&quot; para enviar 2-3 arquivos de áudio de 20-40 segundos cada.
                          </p>
                          <Button
                            onClick={() => {
                              setActiveTab("upload")
                            }}
                            size="lg"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Ir para Upload
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Modal de Teste de Voz */}
          {testingVoice && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Teste a Voz Clonada
                </CardTitle>
                <CardDescription>
                  Ouça a narração de teste e decida se deseja salvar a voz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Voz: {testingVoice.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Texto de teste: &quot;{testText}&quot;
                  </p>
                </div>

                {generatingTest ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Gerando narração de teste...</span>
                  </div>
                ) : testAudioUrl ? (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleTestAudio}
                      >
                        {testAudioPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <audio
                        ref={testAudioRef}
                        src={testAudioUrl}
                        onEnded={() => setTestAudioPlaying(false)}
                        className="flex-1"
                        controls
                      />
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <Button
                    onClick={handleApproveVoice}
                    disabled={!testAudioUrl || generatingTest}
                    className="flex-1"
                    size="lg"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Aprovar e Salvar Voz
                  </Button>
                  <Button
                    onClick={handleRegenerateTest}
                    disabled={!testText.trim() || generatingTest}
                    variant="outline"
                    size="lg"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerar Teste
                  </Button>
                  <Button
                    onClick={handleDiscardVoice}
                    variant="destructive"
                    size="lg"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Descartar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  )
}

