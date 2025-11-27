"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/store/auth-store"
import { 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Loader2,
  Volume2,
  Sparkles,
  ArrowLeft,
  Mic,
} from "lucide-react"
import { VoiceClone } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function VoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const voiceId = params.id as string
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  
  const [voice, setVoice] = useState<VoiceClone | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [text, setText] = useState("")
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [loadingLastGeneration, setLoadingLastGeneration] = useState(false)
  
  // Parâmetros de TTS
  const [selectedModel, setSelectedModel] = useState<'s1' | 'speech-1.5'>('s1') // Modelo: padrão s1
  const [speed, setSpeed] = useState<number>(1.0) // Velocidade: 0.7 a 1.3 (padrão: 1.0)
  const [volume, setVolume] = useState<number>(0) // Volume: -10 a 10 (padrão: 0)
  const [temperature, setTemperature] = useState<number>(0.9) // Temperatura: 0.0 a 1.0 (padrão: 0.9)
  const [topP, setTopP] = useState<number>(0.9) // Top-p: 0.0 a 1.0 (padrão: 0.9)
  const [language, setLanguage] = useState<string>('auto') // Idioma: 'auto' = detectar do áudio (preserva sotaque)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (voiceId && isAuthenticated) {
      loadVoice()
      loadLastGeneration()
    }
  }, [voiceId, isAuthenticated])

  const loadVoice = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/voices/list', {
        method: 'GET',
        credentials: 'include',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const foundVoice = data.voices.find((v: VoiceClone) => v.id === voiceId)
          if (foundVoice) {
            setVoice(foundVoice)
          } else {
            toast({
              title: "Voz não encontrada",
              description: "A voz solicitada não foi encontrada",
              variant: "destructive",
            })
            router.push('/voices')
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar voz:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar voz",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadLastGeneration = async () => {
    try {
      setLoadingLastGeneration(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/voices/generations?voiceCloneId=${voiceId}&limit=1`, {
        method: 'GET',
        credentials: 'include',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.generations && data.generations.length > 0) {
          const lastGeneration = data.generations[0]
          setGeneratedAudioUrl(lastGeneration.audio_url)
          setCurrentGenerationId(lastGeneration.id)
          if (lastGeneration.text) {
            setText(lastGeneration.text)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar última geração:', error)
      // Não mostrar erro, apenas não carregar
    } finally {
      setLoadingLastGeneration(false)
    }
  }

  const handleGenerate = async () => {
    if (!voice || !text.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Digite um texto para gerar a narração",
        variant: "destructive",
      })
      return
    }

    try {
      setGenerating(true)
      setGeneratedAudioUrl(null)

      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/voices/generate-tts', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          voiceId: voice.voiceId,
          voiceCloneId: voice.id,
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
        
        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}`
        const errorDetails = errorData.details || errorData.hint || ""
        
        console.error('❌ Erro ao gerar TTS:', {
          status: response.status,
          error: errorMessage,
          details: errorDetails,
          fullError: errorData
        })
        
        toast({
          title: "Erro ao gerar narração",
          description: errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage,
          variant: "destructive",
        })
        
        throw new Error(errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage)
      }

      const data = await response.json()

      if (data.success) {
        setGeneratedAudioUrl(data.audioUrl)
        if (data.generationId) {
          setCurrentGenerationId(data.generationId)
        }
        toast({
          title: "Sucesso!",
          description: "Narração gerada com sucesso!",
        })
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
    if (generatedAudioUrl) {
      const a = document.createElement('a')
      a.href = generatedAudioUrl
      a.download = `narracao-${voice?.name || 'voz'}-${Date.now()}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleDeleteGeneration = async () => {
    if (!currentGenerationId) return

    if (!confirm('Tem certeza que deseja excluir esta geração?')) {
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

      const response = await fetch(`/api/voices/generations/${currentGenerationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      })

      if (response.ok) {
        setGeneratedAudioUrl(null)
        setCurrentGenerationId(null)
        toast({
          title: "Geração excluída",
          description: "A geração foi excluída com sucesso",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao excluir geração")
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a geração",
        variant: "destructive",
      })
    }
  }

  const handleSaveGeneration = async () => {
    // A geração já é salva automaticamente quando é gerada
    // Este botão apenas confirma que o usuário está satisfeito
    if (currentGenerationId && generatedAudioUrl) {
      toast({
        title: "Geração salva",
        description: "Esta geração já está salva no seu histórico",
      })
    } else {
      toast({
        title: "Nenhuma geração",
        description: "Gere uma narração primeiro",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!voice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Voz não encontrada</p>
        <Button onClick={() => router.push('/voices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Vozes
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/voices')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{voice.name}</h1>
          {voice.description && (
            <p className="text-muted-foreground mt-1">{voice.description}</p>
          )}
        </div>
        <Badge variant={voice.status === 'ready' ? 'default' : 'secondary'}>
          {voice.status === 'ready' ? 'Pronto' : voice.status}
        </Badge>
      </div>

      {/* Gerar Narração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gerar Narração
          </CardTitle>
          <CardDescription>
            Digite um texto e gere uma narração profissional com esta voz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Modelo e Idioma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model-select">Modelo</Label>
              <Select
                value={selectedModel}
                onValueChange={(value) => setSelectedModel(value as 's1' | 'speech-1.5')}
              >
                <SelectTrigger id="model-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s1">s1 (Padrão - Recomendado)</SelectItem>
                  <SelectItem value="speech-1.5">speech-1.5</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Modelo &quot;s1&quot; garante preservação de gênero, timbre e sotaque
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language-select">Idioma/Sotaque (Opcional)</Label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value)}
              >
                <SelectTrigger id="language-select">
                  <SelectValue placeholder="Detectar do áudio (Recomendado)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Detectar do áudio (Recomendado)</SelectItem>
                  <SelectItem value="pt">Português (Detectar sotaque)</SelectItem>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="pt-MZ">Português (Moçambique)</SelectItem>
                  <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                  <SelectItem value="en">Inglês</SelectItem>
                  <SelectItem value="es">Espanhol</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Deixe vazio para detectar automaticamente do áudio (preserva sotaque moçambicano)
              </p>
            </div>
          </div>

          {/* Parâmetros de Áudio */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Parâmetros de Áudio (Opcional)</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="speed">Velocidade: {speed}x</Label>
                  <span className="text-xs text-muted-foreground">0.7x - 1.3x</span>
                </div>
                <input
                  id="speed"
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="volume">Volume: {volume}</Label>
                  <span className="text-xs text-muted-foreground">-10 a 10</span>
                </div>
                <input
                  id="volume"
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperatura: {temperature}</Label>
                  <span className="text-xs text-muted-foreground">0.0 - 1.0 (alta qualidade)</span>
                </div>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="topP">Top-p: {topP}</Label>
                  <span className="text-xs text-muted-foreground">0.0 - 1.0 (alta qualidade)</span>
                </div>
                <input
                  id="topP"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSpeed(1.0)
                setVolume(0)
                setTemperature(0.9)
                setTopP(0.9)
              }}
              className="w-full"
            >
              Resetar para Padrão
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-input">Texto para Narração</Label>
            <Textarea
              id="text-input"
              placeholder="Digite ou cole o texto que deseja converter em narração...&#10;&#10;Por exemplo: Um script de VSL, anúncio, TikTok, YouTube ou qualquer outro projeto."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {text.length} caracteres
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!text.trim() || generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando narração...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Narração
              </>
            )}
          </Button>

          {/* Player de Áudio */}
          {(generatedAudioUrl || loadingLastGeneration) && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              {loadingLastGeneration ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando última geração...</span>
                </div>
              ) : generatedAudioUrl ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Narração {currentGenerationId ? 'Salva' : 'Gerada'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {currentGenerationId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteGeneration}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleAudio}
                    >
                      {audioPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <audio
                      ref={audioRef}
                      src={generatedAudioUrl}
                      onEnded={() => setAudioPlaying(false)}
                      className="flex-1"
                      controls
                    />
                  </div>

                  {currentGenerationId && (
                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSaveGeneration}
                      >
                        ✓ Geração Salva
                      </Button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

