'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Play, Download, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Generation {
  id: string
  text: string
  audio_url: string
  created_at: string
  voice_clones: {
    id: string
    name: string
    voice_id: string
    description?: string
  }
}

interface GenerationsResponse {
  success: boolean
  generations: Generation[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export default function VoiceHistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadGenerations()
  }, [selectedVoiceId])

  const loadGenerations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedVoiceId) {
        params.append('voiceCloneId', selectedVoiceId)
      }
      params.append('limit', pagination.limit.toString())
      params.append('offset', pagination.offset.toString())

      const response = await fetch(`/api/voices/generations?${params.toString()}`)
      const data: GenerationsResponse = await response.json()

      if (data.success) {
        setGenerations(data.generations)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de gerações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const playAudio = (url: string, id: string) => {
    // Parar áudio anterior se estiver tocando
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
    }

    const audio = new Audio(url)
    audio.play()
    setAudioElement(audio)
    setPlayingId(id)

    audio.onended = () => {
      setPlayingId(null)
      setAudioElement(null)
    }

    audio.onerror = () => {
      toast({
        title: "Erro",
        description: "Não foi possível reproduzir o áudio",
        variant: "destructive"
      })
      setPlayingId(null)
      setAudioElement(null)
    }
  }

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
      setAudioElement(null)
      setPlayingId(null)
    }
  }

  const downloadAudio = async (url: string, text: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `voz-${text.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast({
        title: "Download iniciado",
        description: "Áudio baixado com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível baixar o áudio",
        variant: "destructive"
      })
    }
  }

  const deleteGeneration = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta geração?')) {
      return
    }

    try {
      const response = await fetch(`/api/voices/generations/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Geração excluída com sucesso"
        })
        loadGenerations()
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a geração",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir geração",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 break-words">Histórico de Gerações</h1>
        <p className="text-muted-foreground">
          Visualize todas as gerações de voz que você criou
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : generations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma geração encontrada. Comece criando uma voz e gerando áudios!
            </p>
            <Button
              onClick={() => router.push('/voices')}
              className="mt-4"
            >
              Criar Voz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Total: {pagination.total} gerações
          </div>

          <div className="space-y-4">
            {generations.map((generation) => (
              <Card key={generation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {generation.voice_clones.name}
                      </CardTitle>
                      <CardDescription className="mb-2">
                        {generation.text}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(generation.created_at)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={playingId === generation.id ? "destructive" : "default"}
                      onClick={() => {
                        if (playingId === generation.id) {
                          stopAudio()
                        } else {
                          playAudio(generation.audio_url, generation.id)
                        }
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {playingId === generation.id ? 'Parar' : 'Reproduzir'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAudio(generation.audio_url, generation.text)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteGeneration(generation.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setPagination(prev => ({
                    ...prev,
                    offset: prev.offset + prev.limit
                  }))
                  loadGenerations()
                }}
              >
                Carregar mais
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
