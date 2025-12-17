"use client"

/**
 * Página: Área Financeira - Focada em Pagamentos
 * 
 * Exibe:
 * - Pagamentos já feitos (status = 'paid')
 * - Pagamentos pendentes (status = 'pending')
 * - Estatísticas de receita
 */

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Calendar
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Payment {
  id: string
  user_id: string
  plan_id: string
  amount_cents: number
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'completed'
  payment_method?: string
  method?: string
  paid_at?: string
  created_at: string
  user_name?: string
  user_email?: string
  plan_name?: string
}

export default function AdminFinancialPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'completed' | 'pending'>('all')
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [payments, statusFilter, search])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...payments]

    if (statusFilter !== 'all') {
      if (statusFilter === 'paid') {
        // Incluir tanto 'paid' quanto 'completed' quando filtrar por 'paid'
        filtered = filtered.filter((p) => p.status === 'paid' || p.status === 'completed')
      } else {
        filtered = filtered.filter((p) => p.status === statusFilter)
      }
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((p) =>
        p.user_name?.toLowerCase().includes(searchLower) ||
        p.user_email?.toLowerCase().includes(searchLower) ||
        p.plan_name?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredPayments(filtered)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: { variant: 'default' as const, label: 'Pago', icon: CheckCircle2, color: 'text-green-600' },
      completed: { variant: 'default' as const, label: 'Completo', icon: CheckCircle2, color: 'text-green-600' },
      pending: { variant: 'secondary' as const, label: 'Pendente', icon: Clock, color: 'text-yellow-600' },
      failed: { variant: 'destructive' as const, label: 'Falhou', icon: AlertCircle, color: 'text-red-600' },
      refunded: { variant: 'outline' as const, label: 'Reembolsado', icon: AlertCircle, color: 'text-gray-600' },
    }

    const config = variants[status] || { variant: 'outline' as const, label: status, icon: CheckCircle2, color: '' }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    )
  }

  // Calcular estatísticas
  // Incluir tanto 'paid' quanto 'completed' na receita total
  const paidPayments = payments.filter((p) => p.status === 'paid' || p.status === 'completed')
  const pendingPayments = payments.filter((p) => p.status === 'pending')
  
  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount_cents, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount_cents, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Área Financeira</h1>
        <p className="text-muted-foreground">
          Gerenciamento de pagamentos e receitas
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {paidPayments.length} pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length} aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              Todos os status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.length > 0 
                ? `${((paidPayments.length / payments.length) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
          <CardDescription>
            Lista completa de pagamentos do sistema
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

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="completed">Completos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
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
          ) : filteredPayments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.user_name || 'Usuário'}</div>
                          <div className="text-sm text-muted-foreground">{payment.user_email || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{payment.plan_name || 'Plano'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(payment.amount_cents)}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.payment_method || payment.method ? (
                          <Badge variant="outline">{payment.payment_method || payment.method}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.paid_at ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(payment.paid_at)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(payment.created_at)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
