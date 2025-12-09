"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Community {
  id: string
  name: string
  description: string | null
  is_paid: boolean
  join_link: string
  is_active: boolean
  created_at: string
  member_count?: number
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadCommunities()
  }, [])

  const loadCommunities = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/admin/communities', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) throw new Error('Erro ao carregar comunidades')

      const data = await response.json()
      setCommunities(data.communities || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar as comunidades",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCommunity = async (data: any) => {
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('Sessão não encontrada')
        toast({
          title: "Erro",
          description: "Não autenticado. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const url = editingCommunity ? `/api/admin/communities/${editingCommunity.id}` : '/api/admin/communities'
      const method = editingCommunity ? 'PUT' : 'POST'

      const payload = {
        name: data.name,
        description: data.description || null,
        is_paid: data.is_paid || false,
        join_link: data.join_link,
        is_active: data.is_active !== undefined ? data.is_active : true,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json().catch(() => ({ error: 'Erro ao processar resposta' }))

      if (!response.ok) {
        console.error('Erro ao salvar comunidade:', responseData)
        throw new Error(responseData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      toast({
        title: editingCommunity ? "Comunidade atualizada" : "Comunidade criada",
        description: editingCommunity ? "A comunidade foi atualizada com sucesso" : "A nova comunidade foi criada com sucesso",
      })
      
      await loadCommunities()
      setEditingCommunity(null)
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error('Erro ao salvar comunidade:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a comunidade",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (communityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta comunidade?')) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/admin/communities/${communityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) throw new Error('Erro ao excluir comunidade')
      
      toast({
        title: "Comunidade removida",
        description: "A comunidade foi removida com sucesso",
      })
      await loadCommunities()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a comunidade",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Comunidades</h1>
          <p className="text-muted-foreground">
            Gerencie todas as comunidades da plataforma
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCommunity(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Comunidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCommunity ? "Editar Comunidade" : "Nova Comunidade"}</DialogTitle>
              <DialogDescription>
                Preencha os dados da comunidade
              </DialogDescription>
            </DialogHeader>
            <CommunityForm 
              community={editingCommunity} 
              onSave={handleSaveCommunity}
              onCancel={() => {
                setEditingCommunity(null)
                setIsDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma comunidade encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communities.map((community) => (
                  <TableRow key={community.id}>
                    <TableCell className="font-medium">{community.name}</TableCell>
                    <TableCell className="max-w-md truncate">{community.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={community.is_paid ? 'default' : 'secondary'}>
                        {community.is_paid ? 'Paga' : 'Grátis'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {community.member_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={community.is_active ? 'default' : 'secondary'}>
                        {community.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setEditingCommunity(community)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(community.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CommunityForm({ 
  community, 
  onSave, 
  onCancel 
}: { 
  community: Community | null
  onSave: (data: any) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: community?.name || '',
    description: community?.description || '',
    is_paid: community?.is_paid || false,
    join_link: community?.join_link || '',
    is_active: community?.is_active !== undefined ? community.is_active : true,
  })
  const { toast } = useToast()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nome da comunidade"
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição da comunidade"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Link de Entrada *</Label>
        <Input
          value={formData.join_link}
          onChange={(e) => setFormData({ ...formData, join_link: e.target.value })}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_paid"
          checked={formData.is_paid}
          onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="is_paid" className="cursor-pointer">
          Comunidade paga
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Comunidade ativa
        </Label>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Validar campos obrigatórios
            if (!formData.name || !formData.name.trim()) {
              toast({
                title: "Erro de Validação",
                description: "O nome é obrigatório",
                variant: "destructive",
              })
              return
            }
            
            if (!formData.join_link || !formData.join_link.trim()) {
              toast({
                title: "Erro de Validação",
                description: "O link de entrada é obrigatório",
                variant: "destructive",
              })
              return
            }
            
            onSave(formData)
          }}
        >
          {community ? "Atualizar" : "Criar"} Comunidade
        </Button>
      </DialogFooter>
    </div>
  )
}

