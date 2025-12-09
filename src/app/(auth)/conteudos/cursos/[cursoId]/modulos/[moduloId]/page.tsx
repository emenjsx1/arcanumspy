"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Video, Loader2, Play } from "lucide-react"
import { Aula, Modulo, Curso } from "@/types/cursos"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export default function ModuloAulasPage() {
  const params = useParams()
  const router = useRouter()
  const cursoId = params.cursoId as string
  const moduloId = params.moduloId as string
  
  const [curso, setCurso] = useState<Curso | null>(null)
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCurso()
    loadModulo()
    loadAulas()
  }, [cursoId, moduloId])

  const loadCurso = async () => {
    try {
      const response = await fetch(`/api/cursos/${cursoId}`)
      if (!response.ok) {
        router.push('/conteudos/mapa-iniciante')
        return
      }
      
      const data = await response.json()
      setCurso(data.curso)
    } catch (error: any) {
      router.push('/conteudos/mapa-iniciante')
    }
  }

  const loadModulo = async () => {
    try {
      const response = await fetch(`/api/modulos/${moduloId}`)
      if (!response.ok) {
        router.push(`/conteudos/cursos/${cursoId}`)
        return
      }
      
      const data = await response.json()
      setModulo(data.modulo)
    } catch (error: any) {
      router.push(`/conteudos/cursos/${cursoId}`)
    }
  }

  const loadAulas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/modulos/${moduloId}/aulas`)
      if (!response.ok) throw new Error('Erro ao carregar aulas')
      
      const data = await response.json()
      setAulas(data.aulas || [])
      
      // Selecionar primeira aula automaticamente
      if (data.aulas && data.aulas.length > 0) {
        setSelectedAula(data.aulas[0])
      }
    } catch (error: any) {
      console.error('Error loading aulas:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as aulas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  if (loading || !curso || !modulo) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href={`/conteudos/cursos/${cursoId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Curso
          </Button>
        </Link>
        
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">{modulo.nome}</h1>
          <p className="text-gray-400 text-lg">{curso.nome}</p>
          {modulo.descricao && (
            <p className="text-gray-400">{modulo.descricao}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Aulas */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-2xl font-bold text-white">Aulas</h2>
          {aulas.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="py-8 text-center">
                <p className="text-gray-400">Nenhuma aula disponível.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {aulas.map((aula, index) => (
                <Card
                  key={aula.id}
                  className={`bg-[#1a1a1a] border-[#2a2a2a] cursor-pointer transition-colors ${
                    selectedAula?.id === aula.id
                      ? 'border-[#ff5a1f] bg-[#2a1a1a]'
                      : 'hover:border-[#ff5a1f]/50'
                  }`}
                  onClick={() => setSelectedAula(aula)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#ff5a1f]/20 rounded-lg">
                        <Video className="h-4 w-4 text-[#ff5a1f]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500">Aula {index + 1}</span>
                          {aula.duracao_minutos && (
                            <Badge variant="outline" className="text-xs">
                              {aula.duracao_minutos} min
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-white font-medium line-clamp-2">{aula.titulo}</h3>
                        {aula.descricao && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{aula.descricao}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Player de Vídeo */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAula ? (
            <>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-white">{selectedAula.titulo}</CardTitle>
                  {selectedAula.descricao && (
                    <CardDescription className="text-gray-400">
                      {selectedAula.descricao}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={getVideoEmbedUrl(selectedAula.video_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selectedAula.titulo}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="py-12 text-center">
                <p className="text-gray-400">Selecione uma aula para assistir</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

