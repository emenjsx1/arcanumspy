"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  Clock, 
  Volume2,
  Download,
  Edit,
  CheckCircle2
} from "lucide-react"
import { VoiceClone } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function MyVoicesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [voices, setVoices] = useState<VoiceClone[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioRefs, setAudioRefs] = useState<Map<string, HTMLAudioElement>>(new Map())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [voiceToDelete, setVoiceToDelete] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadVoices()
  }, [])

  const loadVoices = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/voices/list', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar vozes')
      }

      const data = await response.json()
      if (data.success && data.voices) {
        setVoices(data.voices)
      } else {
        setVoices([])
      }
    } catch (error: any) {
      console.error('Erro ao carregar vozes:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar vozes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePlay = (voiceId: string) => {
    if (playingId === voiceId) {
      // Pausar
      const audio = audioRefs.get(voiceId)
      if (audio) {
        audio.pause()
        setPlayingId(null)
      }
    } else {
      // Parar áudio atual se houver
      if (playingId) {
        const currentAudio = audioRefs.get(playingId)
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.currentTime = 0
        }
      }

      // Reproduzir nova voz
      const voice = voices.find(v => v.id === voiceId)
      if (voice?.audioUrl || ((voice as any)?.audio_urls && (voice as any).audio_urls.length > 0)) {
        const audioUrl = voice?.audioUrl || (voice as any)?.audio_urls?.[0]
        const audio = new Audio(audioUrl)
        audioRefs.set(voiceId, audio)
        setAudioRefs(new Map(audioRefs))
        
        audio.play()
        setPlayingId(voiceId)

        audio.onended = () => {
          setPlayingId(null)
        }

        audio.onerror = () => {
          toast({
            title: "Erro",
            description: "Erro ao reproduzir áudio",
            variant: "destructive",
          })
          setPlayingId(null)
        }
      }
    }
  }

  const handleDelete = async (voiceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/voices/${voiceId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir voz')
      }

      toast({
        title: "Sucesso",
        description: "Voz excluída com sucesso",
      })

      // Remover da lista
      setVoices(voices.filter(v => v.id !== voiceId))
      setDeleteDialogOpen(false)
      setVoiceToDelete(null)

      // Limpar áudio se estava tocando
      if (playingId === voiceId) {
        const audio = audioRefs.get(voiceId)
        if (audio) {
          audio.pause()
          setPlayingId(null)
        }
        audioRefs.delete(voiceId)
        setAudioRefs(new Map(audioRefs))
      }
    } catch (error: any) {
      console.error('Erro ao excluir voz:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir voz",
        variant: "destructive",
      })
    }
  }

  const handleDownload = (voice: VoiceClone) => {
    const audioUrl = voice.audioUrl || (voice as any).audio_urls?.[0]
    if (audioUrl) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `${voice.name}.mp3`
      link.click()
    }
  }

  const handleUseVoice = (voiceId: string) => {
    // Redirecionar para a página de geração de narração com esta voz
    router.push(`/voices/${voiceId}`)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Minhas Vozes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas vozes clonadas
          </p>
        </div>
        <Button onClick={() => router.push('/voices')} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Criar Nova Voz
        </Button>
      </div>

      {/* Voices List - UI Profissional Minimalista */}
      <Card>
        <CardHeader>
          <CardTitle>Vozes Clonadas</CardTitle>
          <CardDescription>
            {voices.length === 0 
              ? "Nenhuma voz criada"
              : `${voices.length} ${voices.length === 1 ? 'voz' : 'vozes'} criada${voices.length === 1 ? '' : 's'}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          ) : voices.length === 0 ? (
            <div className="text-center py-12 border rounded">
              <Volume2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-base font-medium mb-1">Nenhuma voz encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece criando sua primeira voz clonada
              </p>
              <Button onClick={() => router.push('/voices')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Voz
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {voices.map((voice) => {
                // Validar se há URL de áudio válida
                const hasAudio = voice?.audioUrl || ((voice as any)?.audio_urls && (voice as any).audio_urls.length > 0)
                
                return (
                  <div
                    key={voice.id}
                    className="flex items-center gap-4 p-4 border rounded hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                      <Volume2 className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1">{voice.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatDate(voice.createdAt)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUseVoice(voice.id)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Usar
                      </Button>
                      {hasAudio && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlay(voice.id)}
                        >
                          {playingId === voice.id ? (
                            <>
                              <Pause className="h-4 w-4 mr-1.5" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1.5" />
                              Ouvir
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setVoiceToDelete(voice.id)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta voz? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => voiceToDelete && handleDelete(voiceToDelete)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

