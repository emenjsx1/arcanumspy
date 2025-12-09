"use client"

/**
 * Página: Área Financeira Completa
 * 
 * Exibe:
 * - Assinaturas de usuários (gratuitas e pagas)
 * - Próximas renovações
 * - Status de pagamento
 * - Busca e filtros
 * - Relatórios completos
 */

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  Search, 
  Filter,
  FileText,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useLocale } from "@/contexts/locale-context"
import { SubscriptionWithDetails } from "@/app/api/admin/subscriptions/route"

export default function AdminFinancialPage() {
  const { locale: localeString, currency } = useLocale()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithDetails[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithDetails[]>([])
  const [reports, setReports] = useState<any>(null)
  const [reportsLoading, setReportsLoading] = useState(false)

  // Filtros
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  // Planos disponíveis
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, search, planFilter, statusFilter, paymentFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Carregar assinaturas
      const subscriptionsResponse = await fetch('/api/admin/subscriptions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json()
        setSubscriptions(subscriptionsData.subscriptions || [])
      }

      // Carregar planos
      const plansResponse = await fetch('/api/plans', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData.plans || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...subscriptions]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((sub) =>
        sub.user_name.toLowerCase().includes(searchLower) ||
        sub.user_email.toLowerCase().includes(searchLower) ||
        sub.plan_name.toLowerCase().includes(searchLower)
      )
    }

    if (planFilter && planFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.plan_id === planFilter)
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter)
    }

    if (paymentFilter === 'paid') {
      filtered = filtered.filter((sub) => sub.has_payment)
    } else if (paymentFilter === 'unpaid') {
      filtered = filtered.filter((sub) => !sub.has_payment && !sub.is_free_plan)
    }
    // Se paymentFilter for 'all', não aplicar filtro de pagamento

    setFilteredSubscriptions(filtered)
  }

  const loadReports = async (period: string = 'month') => {
    setReportsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/admin/financial/reports?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setReportsLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(localeString, {
      style: 'currency',
      currency: currency,
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: 'default' as const, label: 'Ativa', icon: CheckCircle2 },
      trial: { variant: 'secondary' as const, label: 'Trial', icon: Calendar },
      past_due: { variant: 'destructive' as const, label: 'Atrasada', icon: AlertCircle },
      canceled: { variant: 'outline' as const, label: 'Cancelada', icon: XCircle },
    }

    const config = variants[status] || { variant: 'outline' as const, label: status, icon: CheckCircle2 }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === 'active').length,
    free: subscriptions.filter((s) => s.is_free_plan).length,
    paid: subscriptions.filter((s) => !s.is_free_plan).length,
    withPayment: subscriptions.filter((s) => s.has_payment).length,
    withoutPayment: subscriptions.filter((s) => !s.has_payment && !s.is_free_plan).length,
    totalRevenue: subscriptions.reduce((sum, s) => sum + s.total_paid, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Área Financeira</h1>
        <p className="text-muted-foreground">
          Gerenciamento completo de assinaturas, pagamentos e relatórios
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Assinaturas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Pagos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              {stats.withPayment} com pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Gratuitos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
            <p className="text-xs text-muted-foreground">
              Sem custo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Todas as assinaturas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Tab: Assinaturas */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas de Usuários</CardTitle>
              <CardDescription>
                Lista completa de assinaturas com filtros e busca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou plano..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os planos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os planos</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="past_due">Atrasada</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Com pagamento</SelectItem>
                    <SelectItem value="unpaid">Sem pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredSubscriptions.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Próxima Renovação</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Total Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sub.user_name}</div>
                              <div className="text-sm text-muted-foreground">{sub.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sub.plan_name}</div>
                              {sub.is_free_plan ? (
                                <Badge variant="secondary" className="mt-1">Gratuito</Badge>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(sub.plan_price_cents)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            {sub.next_renewal ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(sub.next_renewal)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub.is_free_plan ? (
                              <Badge variant="secondary">Gratuito</Badge>
                            ) : sub.has_payment ? (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Pago ({sub.total_payments}x)
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Não pago
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub.total_paid > 0 ? (
                              <div className="font-medium">{formatCurrency(sub.total_paid)}</div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma assinatura encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Relatórios */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Relatórios Financeiros</CardTitle>
                  <CardDescription>
                    Relatórios detalhados de receitas, assinaturas e pagamentos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="month" onValueChange={loadReports}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Hoje</SelectItem>
                      <SelectItem value="week">Últimos 7 dias</SelectItem>
                      <SelectItem value="month">Este mês</SelectItem>
                      <SelectItem value="year">Este ano</SelectItem>
                      <SelectItem value="all">Todo período</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => loadReports('month')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : reports ? (
                <div className="space-y-6">
                  {/* Receitas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Receitas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Total de Receitas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(reports.revenue.total)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {reports.revenue.payments_count} pagamentos
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Receitas por Plano</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {reports.revenue.by_plan.map((plan: any) => (
                              <div key={plan.name} className="flex justify-between">
                                <span>{plan.name}</span>
                                <span className="font-medium">
                                  {formatCurrency(plan.amount)} ({plan.count}x)
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Assinaturas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Assinaturas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{reports.subscriptions.total}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Ativas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {reports.subscriptions.active}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Canceladas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {reports.subscriptions.cancelled}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Pagamentos Pendentes */}
                  {reports.pending.count > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Pagamentos Pendentes</h3>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Total Pendente: {formatCurrency(reports.pending.total_amount)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground mb-4">
                            {reports.pending.count} pagamentos pendentes
                          </div>
                          <div className="space-y-2">
                            {reports.pending.payments.slice(0, 10).map((p: any) => (
                              <div key={p.id} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                  <div className="font-medium">{p.user_name}</div>
                                  <div className="text-sm text-muted-foreground">{p.plan_name}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(p.amount_cents)}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatDate(p.created_at)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Próximas Renovações */}
                  {reports.renewals.upcoming_30_days.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Próximas Renovações (30 dias)</h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            {reports.renewals.upcoming_30_days.map((r: any) => (
                              <div key={r.id} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                  <div className="font-medium">{r.user_name}</div>
                                  <div className="text-sm text-muted-foreground">{r.plan_name}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(r.amount_cents)}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatDate(r.renewal_date)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Usuários sem Pagamento */}
                  {reports.users_without_payment.count > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Usuários sem Pagamento ({reports.users_without_payment.count})
                      </h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            {reports.users_without_payment.users.map((u: any) => (
                              <div key={u.user_id} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                  <div className="font-medium">{u.user_name}</div>
                                  <div className="text-sm text-muted-foreground">{u.user_email}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{u.plan_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Desde {formatDate(u.started_at)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Clique em &quot;Gerar Relatório&quot; para ver os dados
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
