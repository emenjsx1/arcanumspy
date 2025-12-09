"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Video, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Aula, Modulo, Curso } from "@/types/cursos"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function AdminAulasPage() {
  const params = useParams()
  const router = useRouter()
  const cursoId = params.cursoId as string
  const moduloId = params.moduloId as string
  
  const [curso, setCurso] = useState<Curso | null>(null)
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAula, setEditingAula] = useState<Aula | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [aulaToDelete, setAulaToDelete] = useState<Aula | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCurso()
    loadModulo()
    loadAulas()
  }, [cursoId, moduloId])

  const loadCurso = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/cursos')
        return
      }

      const response = await fetch(`/api/cursos/${cursoId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (!response.ok) throw new Error('Erro ao carregar curso')
      
      const data = await response.json()
      setCurso(data.curso)
    } catch (error: any) {
      router.push('/admin/cursos')
    }
  }

  const loadModulo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/admin/cursos/${cursoId}/modulos`)
        return
      }

      const response = await fetch(`/api/modulos/${moduloId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (!response.ok) throw new Error('Erro ao carregar módulo')
      
      const data = await response.json()
      setModulo(data.modulo)
    } catch (error: any) {
      router.push(`/admin/cursos/${cursoId}/modulos`)
    }
  }

  const loadAulas = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/modulos/${moduloId}/aulas?include_inactive=true`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (!response.ok) throw new Error('Erro ao carregar aulas')
      
      const data = await response.json()
      setAulas(data.aulas || [])
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

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/modulos/${moduloId}/aulas`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          modulo_id: moduloId,
          titulo: formData.get('titulo'),
          descricao: formData.get('descricao') || null,
          video_url: formData.get('video_url'),
          duracao_minutos: formData.get('duracao_minutos') ? parseInt(formData.get('duracao_minutos') as string) : null,
          ordem: parseInt(formData.get('ordem') as string) || 0,
          is_active: (formData.get('is_active') as string) === 'on' || false
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar aula')
      }

      toast({
        title: "Aula criada",
        description: "A aula foi criada com sucesso",
      })
      
      setIsCreateDialogOpen(false)
      await loadAulas()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a aula",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingAula) return
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/aulas/${editingAula.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          titulo: formData.get('titulo'),
          descricao: formData.get('descricao') || null,
          video_url: formData.get('video_url'),
          duracao_minutos: formData.get('duracao_minutos') ? parseInt(formData.get('duracao_minutos') as string) : null,
          ordem: parseInt(formData.get('ordem') as string) || 0,
          is_active: (formData.get('is_active') as string) === 'on' || false
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar aula')
      }

      toast({
        title: "Aula atualizada",
        description: "A aula foi atualizada com sucesso",
      })
      
      setIsEditDialogOpen(false)
      setEditingAula(null)
      await loadAulas()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a aula",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!aulaToDelete) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/aulas/${aulaToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar aula')
      }

      toast({
        title: "Aula deletada",
        description: "A aula foi deletada com sucesso",
      })
      
      setIsDeleteDialogOpen(false)
      setAulaToDelete(null)
      await loadAulas()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar a aula",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/cursos/${cursoId}/modulos`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Aulas do Módulo</h1>
          <p className="text-muted-foreground">
            {curso?.nome} - {modulo?.nome}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Aula</DialogTitle>
              <DialogDescription>
                Preencha os dados da nova aula
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da Aula *</Label>
                  <Input id="titulo" name="titulo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" name="descricao" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL do Vídeo *</Label>
                  <Input id="video_url" name="video_url" type="url" required placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracao_minutos">Duração (minutos)</Label>
                  <Input id="duracao_minutos" name="duracao_minutos" type="number" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input id="ordem" name="ordem" type="number" defaultValue={0} />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="is_active" name="is_active" defaultChecked className="h-4 w-4" />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {aulas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhuma aula cadastrada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {aulas.map((aula) => (
            <Card key={aula.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      {aula.titulo}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {aula.descricao || "Sem descrição"}
                    </CardDescription>
                    {aula.duracao_minutos && (
                      <Badge variant="outline" className="mt-2">
                        {aula.duracao_minutos} min
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!aula.is_active && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAula(aula)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAulaToDelete(aula)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>URL do Vídeo:</Label>
                  <p className="text-sm text-muted-foreground break-all">{aula.video_url}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
            <DialogDescription>
              Atualize os dados da aula
            </DialogDescription>
          </DialogHeader>
          {editingAula && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-titulo">Título da Aula *</Label>
                  <Input id="edit-titulo" name="titulo" defaultValue={editingAula.titulo} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Textarea id="edit-descricao" name="descricao" defaultValue={editingAula.descricao || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-video_url">URL do Vídeo *</Label>
                  <Input id="edit-video_url" name="video_url" type="url" defaultValue={editingAula.video_url} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duracao_minutos">Duração (minutos)</Label>
                  <Input id="edit-duracao_minutos" name="duracao_minutos" type="number" min="0" defaultValue={editingAula.duracao_minutos || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ordem">Ordem</Label>
                  <Input id="edit-ordem" name="ordem" type="number" defaultValue={editingAula.ordem} />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="edit-is_active" name="is_active" defaultChecked={editingAula.is_active} className="h-4 w-4" />
                  <Label htmlFor="edit-is_active">Ativo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a aula &quot;{aulaToDelete?.titulo}&quot;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

