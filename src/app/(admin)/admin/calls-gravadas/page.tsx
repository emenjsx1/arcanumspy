"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Phone, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"

interface CallGravada {
  id: string
  nome: string
  video_url: string
  data_call: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminCallsGravadasPage() {
  const [calls, setCalls] = useState<CallGravada[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCall, setEditingCall] = useState<CallGravada | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [callToDelete, setCallToDelete] = useState<CallGravada | null>(null)
  const { toast } = useToast()

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
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/conteudos/calls-gravadas?include_inactive=true', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (!response.ok) throw new Error('Erro ao carregar calls')
      
      const data = await response.json()
      setCalls(data.calls || [])
    } catch (error: any) {
      console.error('Error loading calls:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as calls",
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

      const isActive = formData.get('is_active') === 'on' || formData.get('is_active') === 'true'
      
      const response = await fetch('/api/conteudos/calls-gravadas', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome: formData.get('nome'),
          video_url: formData.get('video_url'),
          data_call: formData.get('data_call'),
          is_active: isActive
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || 'Erro ao criar call')
      }

      toast({
        title: "Call criada",
        description: "A call foi criada com sucesso",
      })
      
      setIsCreateDialogOpen(false)
      await loadCalls()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a call",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCall) return
    
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

      const isActive = formData.get('is_active') === 'on' || formData.get('is_active') === 'true'
      
      const response = await fetch(`/api/conteudos/calls-gravadas/${editingCall.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome: formData.get('nome'),
          video_url: formData.get('video_url'),
          data_call: formData.get('data_call'),
          is_active: isActive
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar call')
      }

      toast({
        title: "Call atualizada",
        description: "A call foi atualizada com sucesso",
      })
      
      setIsEditDialogOpen(false)
      setEditingCall(null)
      await loadCalls()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a call",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!callToDelete) return
    
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

      const response = await fetch(`/api/conteudos/calls-gravadas/${callToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar call')
      }

      toast({
        title: "Call deletada",
        description: "A call foi deletada com sucesso",
      })
      
      setIsDeleteDialogOpen(false)
      setCallToDelete(null)
      await loadCalls()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar a call",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Calls Gravadas</h1>
          <p className="text-muted-foreground">Gerencie as calls gravadas disponíveis</p>
        </div>
        <div className="text-center py-8">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Calls Gravadas</h1>
          <p className="text-muted-foreground">Gerencie as calls gravadas disponíveis</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Call
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Call</DialogTitle>
              <DialogDescription>
                Preencha os dados da nova call
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Call *</Label>
                  <Input id="nome" name="nome" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL do Vídeo *</Label>
                  <Input id="video_url" name="video_url" type="url" required placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_call">Data da Call *</Label>
                  <Input id="data_call" name="data_call" type="date" required />
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

      {calls.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhuma call cadastrada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calls.map((call) => (
            <Card key={call.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      {call.nome}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(call.data_call).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  {!call.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCall(call)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCallToDelete(call)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
            <DialogTitle>Editar Call</DialogTitle>
            <DialogDescription>
              Atualize os dados da call
            </DialogDescription>
          </DialogHeader>
          {editingCall && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome da Call *</Label>
                  <Input id="edit-nome" name="nome" defaultValue={editingCall.nome} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-video_url">URL do Vídeo *</Label>
                  <Input id="edit-video_url" name="video_url" type="url" defaultValue={editingCall.video_url} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-data_call">Data da Call *</Label>
                  <Input id="edit-data_call" name="data_call" type="date" defaultValue={editingCall.data_call} required />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="edit-is_active" name="is_active" defaultChecked={editingCall.is_active} className="h-4 w-4" />
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
              Tem certeza que deseja deletar a call &quot;{callToDelete?.nome}&quot;? Esta ação não pode ser desfeita.
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

