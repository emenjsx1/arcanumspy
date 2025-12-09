"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, BookOpen, ArrowLeft, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Modulo, Curso } from "@/types/cursos"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function AdminModulosPage() {
  const params = useParams()
  const router = useRouter()
  const cursoId = params.cursoId as string
  
  const [curso, setCurso] = useState<Curso | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [moduloToDelete, setModuloToDelete] = useState<Modulo | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCurso()
    loadModulos()
  }, [cursoId])

  const loadCurso = async () => {
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar o curso",
        variant: "destructive",
      })
      router.push('/admin/cursos')
    }
  }

  const loadModulos = async () => {
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

      const response = await fetch(`/api/cursos/${cursoId}/modulos?include_inactive=true`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
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

      const response = await fetch(`/api/cursos/${cursoId}/modulos`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          curso_id: cursoId,
          nome: formData.get('nome'),
          descricao: formData.get('descricao') || null,
          ordem: parseInt(formData.get('ordem') as string) || 0,
          is_active: (formData.get('is_active') as string) === 'on' || false
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar módulo')
      }

      toast({
        title: "Módulo criado",
        description: "O módulo foi criado com sucesso",
      })
      
      setIsCreateDialogOpen(false)
      await loadModulos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o módulo",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingModulo) return
    
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

      const response = await fetch(`/api/modulos/${editingModulo.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome: formData.get('nome'),
          descricao: formData.get('descricao') || null,
          ordem: parseInt(formData.get('ordem') as string) || 0,
          is_active: (formData.get('is_active') as string) === 'on' || false
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar módulo')
      }

      toast({
        title: "Módulo atualizado",
        description: "O módulo foi atualizado com sucesso",
      })
      
      setIsEditDialogOpen(false)
      setEditingModulo(null)
      await loadModulos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o módulo",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!moduloToDelete) return
    
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

      const response = await fetch(`/api/modulos/${moduloToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar módulo')
      }

      toast({
        title: "Módulo deletado",
        description: "O módulo foi deletado com sucesso",
      })
      
      setIsDeleteDialogOpen(false)
      setModuloToDelete(null)
      await loadModulos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar o módulo",
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
        <Link href="/admin/cursos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Módulos do Curso</h1>
          <p className="text-muted-foreground">
            {curso?.nome || "Carregando..."}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Módulo</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo módulo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Módulo *</Label>
                  <Input id="nome" name="nome" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" name="descricao" />
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

      {modulos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum módulo cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map((modulo) => (
            <Card key={modulo.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {modulo.nome}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {modulo.descricao || "Sem descrição"}
                    </CardDescription>
                  </div>
                  {!modulo.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/admin/cursos/${cursoId}/modulos/${modulo.id}/aulas`}>
                    <Button variant="outline" size="sm">
                      Gerenciar Aulas
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingModulo(modulo)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setModuloToDelete(modulo)
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
            <DialogTitle>Editar Módulo</DialogTitle>
            <DialogDescription>
              Atualize os dados do módulo
            </DialogDescription>
          </DialogHeader>
          {editingModulo && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome do Módulo *</Label>
                  <Input id="edit-nome" name="nome" defaultValue={editingModulo.nome} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Textarea id="edit-descricao" name="descricao" defaultValue={editingModulo.descricao || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ordem">Ordem</Label>
                  <Input id="edit-ordem" name="ordem" type="number" defaultValue={editingModulo.ordem} />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="edit-is_active" name="is_active" defaultChecked={editingModulo.is_active} className="h-4 w-4" />
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
              Tem certeza que deseja deletar o módulo &quot;{moduloToDelete?.nome}&quot;? Esta ação não pode ser desfeita e todas as aulas deste módulo serão deletadas.
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

