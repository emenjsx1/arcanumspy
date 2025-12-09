"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Loader2, ArrowRight } from "lucide-react"
import { Curso, Modulo } from "@/types/cursos"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export default function CursoPage() {
  const params = useParams()
  const router = useRouter()
  const cursoId = params.cursoId as string
  
  const [curso, setCurso] = useState<Curso | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCurso()
    loadModulos()
  }, [cursoId])

  const loadCurso = async () => {
    try {
      const response = await fetch(`/api/cursos/${cursoId}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/conteudos/mapa-iniciante')
          return
        }
        throw new Error('Erro ao carregar curso')
      }
      
      const data = await response.json()
      setCurso(data.curso)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o curso",
        variant: "destructive",
      })
      router.push('/conteudos/mapa-iniciante')
    }
  }

  const loadModulos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cursos/${cursoId}/modulos`)
      if (!response.ok) throw new Error('Erro ao carregar módulos')
      
      const data = await response.json()
      setModulos(data.modulos || [])
    } catch (error: any) {
      console.error('Error loading modulos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os módulos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !curso) {
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
        <Link href="/conteudos/mapa-iniciante">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">{curso.nome}</h1>
          {curso.descricao && (
            <p className="text-gray-400 text-lg">{curso.descricao}</p>
          )}
        </div>
      </div>

      {modulos.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">Nenhum módulo disponível neste curso.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {modulos.map((modulo, index) => (
            <Card key={modulo.id} className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f] transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ff5a1f]/20 rounded-lg">
                    <BookOpen className="h-5 w-5 text-[#ff5a1f]" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white">Módulo {index + 1}</CardTitle>
                    <CardTitle className="text-white text-lg mt-1">{modulo.nome}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400 mb-4">
                  {modulo.descricao || "Sem descrição"}
                </CardDescription>
                <Link href={`/conteudos/cursos/${cursoId}/modulos/${modulo.id}`}>
                  <Button className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
                    Ver Aulas <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

