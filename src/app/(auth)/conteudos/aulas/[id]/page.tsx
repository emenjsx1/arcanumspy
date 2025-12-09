"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Video, Loader2, CheckCircle2, Clock } from "lucide-react"
import { Aula, Modulo, Curso } from "@/types/cursos"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface AulaProgress {
  concluida: boolean
  progresso_percentual: number
  tempo_assistido_segundos: number
  data_conclusao?: string
}

export default function AulaPage() {
  const params = useParams()
  const router = useRouter()
  const aulaId = params.id as string
  
  const [aula, setAula] = useState<Aula | null>(null)
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [curso, setCurso] = useState<Curso | null>(null)
  const [progress, setProgress] = useState<AulaProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAula()
    loadProgress()
  }, [aulaId])

  const loadAula = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/aulas/${aulaId}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/conteudos/mapa-iniciante')
          return
        }
        throw new Error('Erro ao carregar aula')
      }
      
      const data = await response.json()
      setAula(data.aula)
      
      // Carregar módulo
      const moduloResponse = await fetch(`/api/modulos/${data.aula.modulo_id}`)
      if (moduloResponse.ok) {
        const moduloData = await moduloResponse.json()
        setModulo(moduloData.modulo)
        
        // Carregar curso
        const cursoResponse = await fetch(`/api/cursos/${moduloData.modulo.curso_id}`)
        if (cursoResponse.ok) {
          const cursoData = await cursoResponse.json()
          setCurso(cursoData.curso)
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a aula",
        variant: "destructive",
      })
      router.push('/conteudos/mapa-iniciante')
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/aulas/${aulaId}/progress`)
      if (response.ok) {
        const data = await response.json()
        setProgress(data.progress)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const updateProgress = async (progressoPercentual: number, tempoAssistido: number, concluida: boolean = false) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/aulas/${aulaId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progresso_percentual: progressoPercentual,
          tempo_assistido_segundos: tempoAssistido,
          concluida: concluida || progressoPercentual >= 90 // Considera concluída se assistiu 90%+
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar progresso')
      }

      const data = await response.json()
      setProgress(data.progress)
      
      if (data.progress.concluida && !progress?.concluida) {
        toast({
          title: "Parabéns!",
          description: "Aula concluída com sucesso!",
        })
      }
    } catch (error: any) {
      console.error('Error updating progress:', error)
    } finally {
      setSaving(false)
    }
  }

  const getVideoEmbedUrl = (url: string): string => {
    // YouTube
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return `https://player.vimeo.com/video/${videoId}`
    }
    // Retornar URL original se não for YouTube ou Vimeo
    return url
  }

  const handleVideoProgress = () => {
    // Esta função será chamada periodicamente pelo player de vídeo
    // Por enquanto, vamos simular com um intervalo
    // Em produção, você deve integrar com a API do YouTube/Vimeo para obter o progresso real
  }

  if (loading || !aula) {
    return (
      <div className="space-y-4 md:space-y-6 lg:space-y-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f]" />
        </div>
      </div>
    )
  }

  const breadcrumbPath = curso && modulo 
    ? `/conteudos/cursos/${curso.id}/modulos/${modulo.id}`
    : '/conteudos/mapa-iniciante'

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href={breadcrumbPath}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {curso && (
              <>
                <span>{curso.nome}</span>
                <span>/</span>
              </>
            )}
            {modulo && (
              <>
                <span>{modulo.nome}</span>
                <span>/</span>
              </>
            )}
            <span className="text-white">{aula.titulo}</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">{aula.titulo}</h1>
          {aula.descricao && (
            <p className="text-gray-400 text-lg">{aula.descricao}</p>
          )}
        </div>

        {progress && (
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {progress.concluida ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Concluída</span>
                    </div>
                  ) : progress.progresso_percentual > 0 ? (
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Em Andamento</span>
                    </div>
                  ) : null}
                  {progress.tempo_assistido_segundos > 0 && (
                    <Badge variant="outline">
                      {Math.floor(progress.tempo_assistido_segundos / 60)} min assistidos
                    </Badge>
                  )}
                </div>
                <div className="flex-1 max-w-md">
                  <Progress value={progress.progresso_percentual} />
                  <p className="text-sm text-gray-400 mt-1 text-right">
                    {progress.progresso_percentual}% concluído
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Video className="h-5 w-5" />
            Vídeo da Aula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={getVideoEmbedUrl(aula.video_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={aula.titulo}
              onLoad={() => {
                // Quando o vídeo carregar, podemos iniciar o tracking de progresso
                // Em produção, você deve usar a API do YouTube/Vimeo para rastrear o progresso
              }}
            />
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>💡 Dica: O progresso é salvo automaticamente enquanto você assiste.</p>
            {aula.duracao_minutos && (
              <p className="mt-1">Duração estimada: {aula.duracao_minutos} minutos</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

