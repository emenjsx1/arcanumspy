"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Users,
  DollarSign,
  Loader2,
  Ban,
  CheckCircle2,
  Search
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CreditStats {
  total_users_with_credits: number
  total_credits_loaded: number
  total_credits_consumed: number
  users_with_negative_balance: number
  total_debt: number
}

interface UserCredits {
  id: string
  user_id: string
  balance: number
  total_loaded: number
  total_consumed: number
  is_blocked: boolean
  user_name?: string
  user_email?: string
  updated_at: string
}

interface CreditTransaction {
  id: string
  user_id: string
  type: 'credit' | 'debit'
  amount: number
  balance_after: number
  category: string
  description: string | null
  created_at: string
}

export default function AdminCreditsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CreditStats | null>(null)
  const [users, setUsers] = useState<UserCredits[]>([])
  const [debts, setDebts] = useState<UserCredits[]>([])
  const [selectedUser, setSelectedUser] = useState<UserCredits | null>(null)
  const [userTransactions, setUserTransactions] = useState<CreditTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [blockingUser, setBlockingUser] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  // CORREÇÃO: Flags para evitar múltiplas execuções simultâneas
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    // CORREÇÃO: Se já carregou os dados ou está carregando, não executar novamente
    if (dataLoaded || isLoadingData) return
    
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, isLoadingData])

  const loadData = async () => {
    // Marcar como carregando para evitar execuções simultâneas
    setIsLoadingData(true)
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      // Carregar estatísticas
      const statsResponse = await fetch('/api/admin/credits?view=stats', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.stats)
        }
      }

      // Carregar usuários
      const usersResponse = await fetch('/api/admin/credits?view=users', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        if (usersData.success) {
          setUsers(usersData.users || [])
        } else {
          console.warn('⚠️ [Admin Credits] Resposta sem success:', usersData)
        }
      } else {
        const errorData = await usersResponse.json().catch(() => ({}))
        console.error('❌ [Admin Credits] Erro ao carregar usuários:', usersResponse.status, errorData)
        toast({
          title: "Erro",
          description: `Erro ao carregar usuários: ${errorData.error || usersResponse.statusText}`,
          variant: "destructive",
        })
      }

      // Carregar dívidas
      const debtsResponse = await fetch('/api/admin/credits?view=debts', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (debtsResponse.ok) {
        const debtsData = await debtsResponse.json()
        if (debtsData.success) {
          setDebts(debtsData.debts)
        }
      }
      
      setDataLoaded(true)
    } catch (error) {
      console.error('Error loading credits data:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de créditos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsLoadingData(false)
    }
  }

  const loadUserTransactions = async (userId: string) => {
    try {
      setLoadingTransactions(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch(`/api/admin/credits/${userId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUserTransactions(data.transactions || [])
        }
      }
    } catch (error) {
      console.error('Error loading user transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleBlockUser = async (user: UserCredits, block: boolean) => {
    try {
      setBlockingUser(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch(`/api/admin/credits/${user.user_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          is_blocked: block
        }),
      })

      if (response.ok) {
        toast({
          title: block ? "Usuário bloqueado" : "Usuário desbloqueado",
          description: block 
            ? "O usuário foi bloqueado por dívida"
            : "O usuário foi desbloqueado",
        })
        await loadData()
        setShowBlockDialog(false)
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário",
        variant: "destructive",
      })
    } finally {
      setBlockingUser(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'purchase': 'Compra',
      'offer_view': 'Visualização',
      'copy_generation': 'Copy',
      'audio_generation': 'Áudio',
      'bonus': 'Bônus',
      'refund': 'Reembolso'
    }
    return labels[category] || category
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.user_name?.toLowerCase().includes(query) ||
      user.user_email?.toLowerCase().includes(query) ||
      user.user_id.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Administração de Créditos</h1>
        <p className="text-muted-foreground">
          Gerencie créditos, monitore transações e controle dívidas
        </p>
      </div>

      {/* Cards de Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users_with_credits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Carregados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.total_credits_loaded.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Consumidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.total_credits_consumed.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários com Dívida</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.users_with_negative_balance}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.total_debt.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas de Dívidas */}
      {debts.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Usuários com Saldo Negativo ({debts.length})
            </CardTitle>
            <CardDescription>
              Usuários que consumiram mais créditos do que têm disponível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debts.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <p className="font-semibold">{user.user_name || user.user_email || 'Sem nome'}</p>
                    <p className="text-sm text-muted-foreground">
                      Saldo: <span className="font-semibold text-destructive">{user.balance} créditos</span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setShowBlockDialog(true)
                    }}
                  >
                    {user.is_blocked ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Desbloquear
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Bloquear
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Usuários e Dívidas */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Todos os Usuários</TabsTrigger>
          <TabsTrigger value="debts">Dívidas Pendentes</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuários e Créditos</CardTitle>
                  <CardDescription>
                    Visualize e gerencie os créditos de todos os usuários
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuário..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Carregado</TableHead>
                      <TableHead>Consumido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.user_name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">{user.user_email || user.user_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${user.balance < 0 ? 'text-destructive' : ''}`}>
                            {user.balance}
                          </span>
                        </TableCell>
                        <TableCell>{user.total_loaded}</TableCell>
                        <TableCell>{user.total_consumed}</TableCell>
                        <TableCell>
                          {user.is_blocked ? (
                            <Badge variant="destructive">Bloqueado</Badge>
                          ) : user.balance < 0 ? (
                            <Badge variant="outline" className="border-destructive text-destructive">
                              Saldo Negativo
                            </Badge>
                          ) : (
                            <Badge variant="default">Ativo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                loadUserTransactions(user.user_id)
                              }}
                            >
                              Ver Histórico
                            </Button>
                            {user.balance < 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowBlockDialog(true)
                                }}
                              >
                                {user.is_blocked ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Desbloquear
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-4 w-4 mr-1" />
                                    Bloquear
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dívidas Pendentes</CardTitle>
              <CardDescription>
                Usuários com saldo negativo que precisam carregar créditos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma dívida pendente
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Total Carregado</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {debts.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.user_name || 'Sem nome'}</p>
                              <p className="text-sm text-muted-foreground">{user.user_email || user.user_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-destructive">
                              {user.balance} créditos
                            </span>
                          </TableCell>
                          <TableCell>{user.total_loaded}</TableCell>
                          <TableCell>
                            {user.is_blocked ? (
                              <Badge variant="destructive">Bloqueado</Badge>
                            ) : (
                              <Badge variant="outline" className="border-destructive text-destructive">
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowBlockDialog(true)
                              }}
                            >
                              {user.is_blocked ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Desbloquear
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Bloquear
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Bloqueio */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_blocked ? "Desbloquear Usuário" : "Bloquear Usuário"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_blocked
                ? `Deseja desbloquear ${selectedUser?.user_name || selectedUser?.user_email}? O usuário poderá usar a plataforma novamente, mas ainda terá saldo negativo.`
                : `Deseja bloquear ${selectedUser?.user_name || selectedUser?.user_email} por dívida? O usuário não poderá usar a plataforma até que a dívida seja paga.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={selectedUser?.is_blocked ? "default" : "destructive"}
              onClick={() => selectedUser && handleBlockUser(selectedUser, !selectedUser.is_blocked)}
              disabled={blockingUser}
            >
              {blockingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : selectedUser?.is_blocked ? (
                "Desbloquear"
              ) : (
                "Bloquear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      {selectedUser && userTransactions.length > 0 && (
        <Dialog open={!!selectedUser} onOpenChange={() => {
          setSelectedUser(null)
          setUserTransactions([])
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Transações</DialogTitle>
              <DialogDescription>
                Transações de {selectedUser.user_name || selectedUser.user_email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Saldo Após</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                          {transaction.type === 'credit' ? (
                            <Badge variant="default" className="bg-green-600">
                              Crédito
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              Débito
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getCategoryLabel(transaction.category)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.description || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {transaction.balance_after}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

