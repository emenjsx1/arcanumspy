"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Play, Search, Loader2, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CallGravada {
  id: string
  nome: string
  video_url: string
  data_call: string
  created_at: string
}

export default function CallsGravadasPage() {
  const [calls, setCalls] = useState<CallGravada[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCall, setSelectedCall] = useState<CallGravada | null>(null)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const { toast } = useToast()

  // Função para extrair ID do YouTube de diferentes formatos de URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }

  useEffect(() => {
    loadCalls()
  }, [])

  const loadCalls = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/conteudos/calls-gravadas', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar calls')
      }

      const data = await response.json()
      if (data.success) {
        setCalls(data.calls || [])
      } else {
        console.warn('⚠️ [Calls User] Resposta sem success:', data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar calls:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar as calls",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCalls = calls.filter(call => {
    if (!search.trim()) return true
    const searchLower = search.toLowerCase()
    return call.nome?.toLowerCase().includes(searchLower)
  })

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-[#ff5a1f] rounded-lg flex-shrink-0">
            <Phone className="h-4 w-4 md:h-6 md:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white break-words">Arquivos Gravados</h1>
            <p className="text-gray-400 text-sm md:text-lg">Acesse seus arquivos de áudio salvos</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          <Input
            placeholder="Buscar calls por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff5a1f]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f]" />
        </div>
      ) : filteredCalls.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-12 text-center">
            <Phone className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {search ? "Nenhuma call encontrada" : "Nenhuma call gravada ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              {filteredCalls.length} {filteredCalls.length === 1 ? 'call encontrada' : 'calls encontradas'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredCalls.map((call) => (
              <Card key={call.id} className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f] transition-colors">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <CardTitle className="text-white text-base md:text-lg line-clamp-2 flex-1 min-w-0">
                      {call.nome}
                    </CardTitle>
                    <Phone className="h-4 w-4 md:h-5 md:w-5 text-[#ff5a1f] flex-shrink-0" />
                  </div>
                  <CardDescription className="text-gray-400 flex items-center gap-2 mt-2 text-xs md:text-sm">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    {new Date(call.data_call).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <Button 
                    onClick={() => {
                      setSelectedCall(call)
                      setIsVideoModalOpen(true)
                    }}
                    className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white text-sm md:text-base h-9 md:h-10"
                  >
                    <Play className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                    Assistir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal de Vídeo */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] md:w-full bg-[#1a1a1a] border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>{selectedCall?.nome}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVideoModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedCall?.video_url && (
            <div className="mt-4">
              {getYouTubeVideoId(selectedCall.video_url) ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedCall.video_url)}?autoplay=1`}
                    title={selectedCall.nome}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                  <p className="text-gray-400 mb-4">URL do vídeo inválida ou não suportada</p>
                  <a
                    href={selectedCall.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ff5a1f] hover:underline"
                  >
                    Abrir em nova aba
                  </a>
                </div>
              )}
              <div className="mt-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <p className="text-gray-300 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data da Call: {new Date(selectedCall.data_call).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

