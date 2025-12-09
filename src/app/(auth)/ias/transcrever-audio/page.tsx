"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileAudio, Upload, Loader2, CheckCircle2, AlertCircle, Download, Copy, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface TranscriptionResult {
  id: string
  arquivo: string
  texto: string
  confianca: number
  duracao: number
  idioma: string
  modelo: string
  palavras_count: number
  palavras?: Array<{
    palavra: string
    inicio: number
    fim: number
    confianca: number
  }>
  status: string
  created_at: string
}

export default function TranscreverAudioPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState('pt-BR')
  const [model, setModel] = useState('nova-2')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (file: File) => {
    // Validar tipo de arquivo
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/aac']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['mp3', 'wav', 'webm', 'ogg', 'm4a', 'aac', 'mp4', 'flac']

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      toast({
        title: "Erro",
        description: "Formato de arquivo não suportado. Use: MP3, WAV, WEBM, OGG, M4A, AAC",
        variant: "destructive"
      })
      return
    }

    // Validar tamanho (25MB)
    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "Erro",
        description: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`,
        variant: "destructive"
      })
      return
    }

    setAudioFile(file)
    setError(null)
    setResult(null)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de áudio",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('language', language)
      formData.append('model', model)

      const response = await fetch('/api/ias/transcrever-audio', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao transcrever áudio')
      }

      setResult(data.transcricao)
      toast({
        title: "Sucesso!",
        description: "Áudio transcrito com sucesso!",
      })
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao processar transcrição"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.texto) return

    try {
      await navigator.clipboard.writeText(result.texto)
      setCopied(true)
      toast({
        title: "Copiado!",
        description: "Transcrição copiada para a área de transferência",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto",
        variant: "destructive"
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <FileAudio className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">
              Transcrever Áudio
            </h1>
            <p className="text-gray-400 text-sm md:text-base lg:text-lg">
              Converta áudio em texto automaticamente usando IA
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mic className="h-5 w-5 text-[#ff5a1f]" />
            Upload de Áudio
          </CardTitle>
          <CardDescription className="text-gray-400">
            Faça upload de um arquivo de áudio para transcrever. Formatos suportados: MP3, WAV, WEBM, OGG, M4A, AAC. Máximo 25MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-white">Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                  <SelectItem value="en-US">Inglês (EUA)</SelectItem>
                  <SelectItem value="es-ES">Espanhol</SelectItem>
                  <SelectItem value="fr-FR">Francês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model" className="text-white">Modelo</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nova-2">Nova-2 (Recomendado)</SelectItem>
                  <SelectItem value="nova">Nova</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Área de Upload */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-[#ff5a1f] bg-[#ff5a1f]/10'
                : 'border-[#2a2a2a] bg-[#0a0a0a]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-[#ff5a1f]' : 'text-gray-500'}`} />
            {audioFile ? (
              <div className="space-y-2">
                <p className="text-white font-medium">{audioFile.name}</p>
                <p className="text-sm text-gray-400">{formatBytes(audioFile.size)}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAudioFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="mt-2 border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  Remover
                </Button>
              </div>
            ) : (
              <>
                <p className="text-gray-400 mb-2">Arraste um arquivo de áudio aqui</p>
                <p className="text-sm text-gray-500 mb-4">ou</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                >
                  Selecionar Arquivo
                </Button>
              </>
            )}
          </div>

          {/* Botão Transcrever */}
          <Button
            onClick={handleTranscribe}
            disabled={!audioFile || loading}
            className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transcrevendo...
              </>
            ) : (
              <>
                <FileAudio className="mr-2 h-4 w-4" />
                Transcrever Áudio
              </>
            )}
          </Button>

          {/* Loading State */}
          {loading && (
            <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-[#ff5a1f] animate-spin" />
                <div className="flex-1">
                  <p className="text-white font-medium">Processando áudio...</p>
                  <p className="text-sm text-gray-400">
                    Isso pode levar alguns segundos dependendo do tamanho do arquivo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium">Erro na transcrição</p>
                  <p className="text-sm text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result State */}
          {result && !loading && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-md">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-400 font-medium">Transcrição concluída!</p>
                    <div className="mt-2 space-y-1 text-sm text-green-300">
                      <p>• Confiança: {(result.confianca * 100).toFixed(1)}%</p>
                      <p>• Duração: {formatTime(result.duracao)}</p>
                      <p>• Palavras: {result.palavras_count}</p>
                      <p>• Modelo: {result.modelo}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Transcrição</Label>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="border-[#2a2a2a] hover:bg-[#2a2a2a] text-white"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                  <p className="text-white whitespace-pre-wrap leading-relaxed">{result.texto}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

