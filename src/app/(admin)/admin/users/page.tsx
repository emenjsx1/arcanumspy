"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Eye, Key, Ban, Check, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface UserWithSubscription {
  id: string
  name: string
  phone_number?: string | null
  email?: string | null
  role: string
  created_at: string
  subscription?: {
    plan?: {
      name: string
      slug: string
    }
    current_period_end?: string | null
    status?: string
  }
  has_paid?: boolean
  is_banned?: boolean
  status?: 'active' | 'paid' | 'unpaid' | 'banned'
  status_label?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("")
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
  const [changePlanUserId, setChangePlanUserId] = useState<string | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
    loadPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPlans = async () => {
    try {
      setLoadingPlans(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/admin/plans', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoadingPlans(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os usuários",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = (user.email || user.id || '').toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase())
    const planSlug = user.subscription?.plan?.slug || 'free'
    const matchesPlan = !planFilter || planSlug === planFilter
    return matchesSearch && matchesPlan
  })

  const handleResetPassword = (userId: string) => {
    setResetPasswordUserId(userId)
    setResetPasswordOpen(true)
  }

  const confirmResetPassword = async () => {
    if (!resetPasswordUserId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/admin/users/${resetPasswordUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao resetar senha')
      }

      const data = await response.json()

      if (data.resetLink) {
        // Copiar link para clipboard
        navigator.clipboard.writeText(data.resetLink)
        toast({
          title: "✅ Link de recuperação gerado",
          description: `Link copiado para a área de transferência! Envie para: ${data.email || 'o usuário'}`,
        })
      } else {
        toast({
          title: "✅ Link de recuperação gerado",
          description: `Um email de recuperação foi enviado para ${data.email || 'o usuário'}`,
        })
      }

      setResetPasswordOpen(false)
      setResetPasswordUserId(null)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível resetar a senha",
        variant: "destructive",
      })
    }
  }

  const handleChangePlan = (userId: string) => {
    setChangePlanUserId(userId)
    setChangePlanOpen(true)
  }

  const confirmChangePlan = async (planId: string) => {
    if (!changePlanUserId || !planId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/admin/users/${changePlanUserId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan_id: planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao alterar plano')
      }

      // Recarregar usuários para atualizar o plano
      await loadUsers()

      toast({
        title: "✅ Plano alterado",
        description: "O plano do usuário foi alterado com sucesso",
      })

      setChangePlanOpen(false)
      setChangePlanUserId(null)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o plano",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (userId: string, currentBanned: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ banned: !currentBanned }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao alterar status')
      }

      // Atualizar estado local
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, is_banned: !currentBanned, status: !currentBanned ? 'banned' : 'paid', status_label: !currentBanned ? 'Bloqueado' : 'Pago' }
          : u
      ))

      toast({
        title: "✅ Status atualizado",
        description: `Usuário ${!currentBanned ? 'bloqueado' : 'desbloqueado'} com sucesso`,
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o status",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (user: UserWithSubscription) => {
    setSelectedUser(user)
    setDetailsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários do sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={planFilter || "all"} onValueChange={(value) => setPlanFilter(value === "all" ? "" : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const planSlug = user.subscription?.plan?.slug || 'free'
                  const planName = user.subscription?.plan?.name || 'Free'
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'Sem nome'}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email && <div>{user.email}</div>}
                            {user.phone_number && <div>{user.phone_number}</div>}
                            {!user.email && !user.phone_number && <div>Sem contato</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.subscription?.plan?.name || 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            Bloqueado
                          </Badge>
                        ) : user.has_paid ? (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Pagamento Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                              <Key className="mr-2 h-4 w-4" />
                              Resetar senha
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangePlan(user.id)}>
                              Alterar plano
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.is_banned || false)}>
                              <Ban className="mr-2 h-4 w-4" />
                              {user.is_banned ? 'Desbloquear' : 'Bloquear'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Usuário */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário e sua assinatura
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* Informações Básicas */}
              <div>
                <h3 className="font-semibold mb-2">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedUser.name || 'Sem nome'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedUser.phone_number || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <Badge variant="outline">{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data de Cadastro</p>
                    <p className="font-medium">
                      {new Date(selectedUser.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações do Plano */}
              <div>
                <h3 className="font-semibold mb-2">Plano e Assinatura</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plano Atual</p>
                    <Badge variant="secondary" className="mt-1">
                      {selectedUser.subscription?.plan?.name || 'Free'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status do Pagamento</p>
                    {selectedUser.is_banned ? (
                      <Badge variant="destructive" className="mt-1">
                        <Ban className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    ) : selectedUser.has_paid ? (
                      <Badge variant="default" className="bg-green-600 mt-1">
                        <Check className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Pagamento Pendente
                      </Badge>
                    )}
                  </div>
                  {selectedUser.subscription?.current_period_end && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Plano Expira em</p>
                      <p className="font-medium">
                        {new Date(selectedUser.subscription.current_period_end).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {new Date(selectedUser.subscription.current_period_end) < new Date() && (
                        <Badge variant="destructive" className="mt-1">
                          Expirado
                        </Badge>
                      )}
                    </div>
                  )}
                  {selectedUser.subscription?.status && (
                    <div>
                      <p className="text-muted-foreground">Status da Assinatura</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedUser.subscription.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Reset de Senha */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription>
              Um link de recuperação de senha será gerado para o usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja gerar um link de recuperação de senha para este usuário?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResetPasswordOpen(false)
              setResetPasswordUserId(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={confirmResetPassword}>
              Gerar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Alterar Plano */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Selecione o novo plano para o usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => (
                  <Button
                    key={plan.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => confirmChangePlan(plan.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{plan.name}</span>
                      <Badge variant="secondary">
                        {new Intl.NumberFormat('pt-MZ', {
                          style: 'currency',
                          currency: 'MZN',
                        }).format((plan.price_monthly_cents || 0) / 100)}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setChangePlanOpen(false)
              setChangePlanUserId(null)
            }}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
