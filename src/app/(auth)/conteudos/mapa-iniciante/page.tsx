"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Map as MapIcon, BookOpen, CheckCircle2, Clock, Lock, Play, Loader2, TrendingUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Curso, Modulo, Aula } from "@/types/cursos"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AulaComProgresso extends Aula {
  progresso?: {
    concluida: boolean
    progresso_percentual: number
    tempo_assistido_segundos: number
  }
  status: 'concluida' | 'em_andamento' | 'bloqueada' | 'disponivel'
}

interface ModuloComAulas extends Modulo {
  aulas?: AulaComProgresso[]
}

interface CursoCompleto extends Curso {
  modulos?: ModuloComAulas[]
  progresso_geral?: number
}

export default function MapaIniciantePage() {
  const [cursos, setCursos] = useState<CursoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAula, setSelectedAula] = useState<AulaComProgresso | null>(null)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const { toast } = useToast()

  // Função para extrair ID do YouTube de diferentes formatos de URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    
    // Padrões comuns de URLs do YouTube
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
    loadCursosComProgresso()
  }, [])

  const loadCursosComProgresso = async () => {
    try {
      setLoading(true)
      
      // Obter sessão para autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }
      
      // Carregar cursos com módulos e aulas
      const cursosResponse = await fetch('/api/cursos', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (!cursosResponse.ok) throw new Error('Erro ao carregar cursos')
      const cursosData = await cursosResponse.json()
      
      // Carregar progresso do usuário
      const progressResponse = await fetch('/api/aulas/progress', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      const progressData = progressResponse.ok ? await progressResponse.json() : { progress: [] }
      
       // Criar mapa de progresso: aula_id -> progresso
       const progressMap = new Map<string, {
         concluida: boolean
         progresso_percentual: number
         tempo_assistido_segundos: number
       }>(
         (progressData.progress || []).map((p: any) => {
           const aulaId = p.aulas?.id || p.aula_id
           return [aulaId, {
             concluida: p.concluida || false,
             progresso_percentual: p.progresso_percentual || 0,
             tempo_assistido_segundos: p.tempo_assistido_segundos || 0
           }]
         })
       )

      // Carregar detalhes completos de cada curso
      const cursosCompletos = await Promise.all(
        (cursosData.cursos || []).map(async (curso: Curso) => {
          // Carregar módulos
          const modulosResponse = await fetch(`/api/cursos/${curso.id}/modulos`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
          const modulosData = modulosResponse.ok ? await modulosResponse.json() : { modulos: [] }
          
          // Para cada módulo, carregar aulas
          const modulosComAulas = await Promise.all(
            (modulosData.modulos || []).map(async (modulo: Modulo) => {
              const aulasResponse = await fetch(`/api/modulos/${modulo.id}/aulas`, {
                credentials: 'include',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
              })
              const aulasData = aulasResponse.ok ? await aulasResponse.json() : { aulas: [] }
              
              const aulasOrdenadas = (aulasData.aulas || []).sort((a: Aula, b: Aula) => a.ordem - b.ordem)
              
              const aulasComProgresso: AulaComProgresso[] = aulasOrdenadas.map((aula: Aula, index: number) => {
                const progressoData = progressMap.get(aula.id)
                const progresso = progressoData ? {
                  concluida: progressoData.concluida,
                  progresso_percentual: progressoData.progresso_percentual,
                  tempo_assistido_segundos: progressoData.tempo_assistido_segundos
                } : undefined
                
                let status: AulaComProgresso['status'] = 'disponivel'
                
                if (progresso?.concluida) {
                  status = 'concluida'
                } else if (progresso && progresso.progresso_percentual > 0) {
                  status = 'em_andamento'
                } else if (aula.ordem > 1) {
                  // Verificar se aula anterior foi concluída
                  const aulaAnterior = aulasOrdenadas[index - 1]
                  if (aulaAnterior) {
                    const progressoAnterior = progressMap.get(aulaAnterior.id)
                    if (!progressoAnterior?.concluida) {
                      status = 'bloqueada'
                    }
                  }
                }
                
                return {
                  ...aula,
                  progresso,
                  status
                }
              })
              
              return {
                ...modulo,
                aulas: aulasComProgresso
              }
            })
          )
          
          // Calcular progresso geral do curso
          const todasAulas = modulosComAulas.flatMap(m => m.aulas || [])
          const aulasConcluidas = todasAulas.filter(a => a.status === 'concluida').length
          const progressoGeral = todasAulas.length > 0 
            ? (aulasConcluidas / todasAulas.length) * 100 
            : 0
          
          return {
            ...curso,
            modulos: modulosComAulas,
            progresso_geral: progressoGeral
          }
        })
      )
      
      setCursos(cursosCompletos)
    } catch (error: any) {
      console.error('Error loading cursos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cursos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: AulaComProgresso['status']) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'em_andamento':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'bloqueada':
        return <Lock className="h-5 w-5 text-gray-500" />
      default:
        return <Play className="h-5 w-5 text-[#ff5a1f]" />
    }
  }

  const getStatusLabel = (status: AulaComProgresso['status']) => {
    switch (status) {
      case 'concluida':
        return 'Concluída'
      case 'em_andamento':
        return 'Em Andamento'
      case 'bloqueada':
        return 'Bloqueada'
      default:
        return 'Disponível'
    }
  }

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-[#ff5a1f] rounded-lg">
            <MapIcon className="h-4 w-4 md:h-6 md:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white break-words">Mapa do Iniciante</h1>
            <p className="text-gray-400 text-xs md:text-sm">Visualize seu progresso e continue sua jornada</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f]" />
        </div>
      ) : cursos.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">Nenhum curso disponível no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {cursos.map((curso) => (
            <Card key={curso.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 md:p-2 bg-[#ff5a1f]/20 rounded-lg flex-shrink-0">
                      <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-[#ff5a1f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-base md:text-lg break-words">{curso.nome}</CardTitle>
                      <CardDescription className="text-gray-400 text-xs md:text-sm">
                        {curso.descricao || "Sem descrição"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-left md:text-right flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-[#ff5a1f]" />
                      <span className="text-white font-bold text-sm md:text-base">
                        {curso.progresso_geral?.toFixed(0) || 0}%
                      </span>
                    </div>
                    <Progress value={curso.progresso_geral || 0} className="w-full md:w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {curso.modulos?.map((modulo) => (
                    <div key={modulo.id} className="space-y-2 md:space-y-3">
                      <h3 className="text-base md:text-lg font-semibold text-white flex flex-wrap items-center gap-1 md:gap-2">
                        <span className="text-[#ff5a1f]">Módulo {modulo.ordem}:</span>
                        <span className="break-words">{modulo.nome}</span>
                      </h3>
                      <div className="space-y-2 pl-2 md:pl-4 border-l-2 border-[#2a2a2a]">
                        {modulo.aulas?.map((aula, index) => (
                          <div
                            key={aula.id}
                            className={`p-2 md:p-3 rounded-lg border transition-colors ${
                              aula.status === 'concluida'
                                ? 'bg-green-500/10 border-green-500/30'
                                : aula.status === 'em_andamento'
                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                : aula.status === 'bloqueada'
                                ? 'bg-gray-500/10 border-gray-500/30 opacity-50'
                                : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#ff5a1f]/50'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
                              <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 mt-0.5 md:mt-0">
                                  {getStatusIcon(aula.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                    <span className="text-white font-medium text-sm md:text-base break-words">
                                      Aula {aula.ordem}: {aula.titulo}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs flex-shrink-0 ${
                                        aula.status === 'concluida'
                                          ? 'border-green-500 text-green-500'
                                          : aula.status === 'em_andamento'
                                          ? 'border-yellow-500 text-yellow-500'
                                          : aula.status === 'bloqueada'
                                          ? 'border-gray-500 text-gray-500'
                                          : 'border-[#ff5a1f] text-[#ff5a1f]'
                                      }`}
                                    >
                                      {getStatusLabel(aula.status)}
                                    </Badge>
                                  </div>
                                  {aula.descricao && (
                                    <p className="text-gray-400 text-xs md:text-sm mt-1 break-words">{aula.descricao}</p>
                                  )}
                                  {aula.progresso && aula.progresso.progresso_percentual > 0 && (
                                    <div className="mt-2">
                                      <Progress 
                                        value={aula.progresso.progresso_percentual} 
                                        className="h-1"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              {aula.status !== 'bloqueada' && (
                                <Button 
                                  size="sm"
                                  variant={aula.status === 'concluida' ? 'outline' : 'default'}
                                  className={`flex-shrink-0 text-xs md:text-sm ${
                                    aula.status === 'concluida'
                                      ? 'border-green-500 text-green-500 hover:bg-green-500/10'
                                      : 'bg-[#ff5a1f] hover:bg-[#ff4d29] text-white'
                                  }`}
                                  onClick={() => {
                                    setSelectedAula(aula)
                                    setIsVideoModalOpen(true)
                                  }}
                                >
                                  {aula.status === 'concluida' ? 'Revisar' : 'Assistir'}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Vídeo */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] md:w-full bg-[#1a1a1a] border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>{selectedAula?.titulo}</span>
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
          {selectedAula?.video_url && (
            <div className="mt-4">
              {getYouTubeVideoId(selectedAula.video_url) ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedAula.video_url)}?autoplay=1`}
                    title={selectedAula.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ minHeight: '200px' }}
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                  <p className="text-gray-400 mb-4">URL do vídeo inválida ou não suportada</p>
                  <a
                    href={selectedAula.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ff5a1f] hover:underline"
                  >
                    Abrir em nova aba
                  </a>
                </div>
              )}
              {selectedAula.descricao && (
                <div className="mt-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                  <p className="text-gray-300 text-sm">{selectedAula.descricao}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

