"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, BookOpen, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Curso } from "@/types/cursos"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [cursoToDelete, setCursoToDelete] = useState<Curso | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCursos()
  }, [])

  const loadCursos = async () => {
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

      const response = await fetch('/api/cursos?include_inactive=true', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (!response.ok) throw new Error('Erro ao carregar cursos')
      
      const data = await response.json()
      setCursos(data.cursos || [])
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

      const response = await fetch('/api/cursos', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome: formData.get('nome'),
          descricao: formData.get('descricao') || null,
          imagem_url: formData.get('imagem_url') || null,
          ordem: parseInt(formData.get('ordem') as string) || 0,
          is_active: (formData.get('is_active') as string) === 'on' || false
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        const errorMessage = errorData.error || errorData.details || 'Erro ao criar curso'
        console.error('❌ Erro ao criar curso:', errorData)
        throw new Error(errorMessage)
      }

      toast({
        title: "Curso criado",
        description: "O curso foi criado com sucesso",
      })
      
      setIsCreateDialogOpen(false)
      await loadCursos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o curso",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCurso) return
    
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

      const response = await fetch(`/api/cursos/${editingCurso.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome: formData.get('nome'),
          descricao: formData.get('descricao') || null,
          imagem_url: formData.get('imagem_url') || null,
          ordem: parseInt(formData.get('ordem') as string) || 0,
          is_active: (formData.get('is_active') as string) === 'on' || false
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar curso')
      }

      toast({
        title: "Curso atualizado",
        description: "O curso foi atualizado com sucesso",
      })
      
      setIsEditDialogOpen(false)
      setEditingCurso(null)
      await loadCursos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o curso",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!cursoToDelete) return
    
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

      const response = await fetch(`/api/cursos/${cursoToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar curso')
      }

      toast({
        title: "Curso deletado",
        description: "O curso foi deletado com sucesso",
      })
      
      setIsDeleteDialogOpen(false)
      setCursoToDelete(null)
      await loadCursos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar o curso",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Cursos</h1>
          <p className="text-muted-foreground">Gerencie os cursos disponíveis</p>
        </div>
        <div className="text-center py-8">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Cursos</h1>
          <p className="text-muted-foreground">Gerencie os cursos disponíveis</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Curso</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo curso
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Curso *</Label>
                  <Input id="nome" name="nome" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" name="descricao" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imagem_url">URL da Imagem</Label>
                  <Input id="imagem_url" name="imagem_url" type="url" />
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

      {cursos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum curso cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursos.map((curso) => (
            <Card key={curso.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {curso.nome}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {curso.descricao || "Sem descrição"}
                    </CardDescription>
                  </div>
                  {!curso.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/admin/cursos/${curso.id}/modulos`}>
                    <Button variant="outline" size="sm">
                      Gerenciar Módulos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCurso(curso)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCursoToDelete(curso)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>
              Atualize os dados do curso
            </DialogDescription>
          </DialogHeader>
          {editingCurso && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome do Curso *</Label>
                  <Input id="edit-nome" name="nome" defaultValue={editingCurso.nome} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Textarea id="edit-descricao" name="descricao" defaultValue={editingCurso.descricao || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-imagem_url">URL da Imagem</Label>
                  <Input id="edit-imagem_url" name="imagem_url" type="url" defaultValue={editingCurso.imagem_url || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ordem">Ordem</Label>
                  <Input id="edit-ordem" name="ordem" type="number" defaultValue={editingCurso.ordem} />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="edit-is_active" name="is_active" defaultChecked={editingCurso.is_active} className="h-4 w-4" />
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
              Tem certeza que deseja deletar o curso &quot;{cursoToDelete?.nome}&quot;? Esta ação não pode ser desfeita.
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

