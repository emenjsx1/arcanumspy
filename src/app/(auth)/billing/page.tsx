"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/store/auth-store"
import { Download, ArrowUp, ArrowDown, X, Loader2, CreditCard, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useLocale } from "@/contexts/locale-context"
import { supabase } from "@/lib/supabase/client"

interface Plan {
  id: string
  name: string
  slug: string
  description?: string | null
  price_monthly_cents: number
  max_offers_visible?: number | null
  max_favorites?: number | null
  [key: string]: any // Permitir propriedades adicionais
}

interface CurrentSubscription {
  plan?: Plan
}

export default function BillingPage() {
  const { profile, user } = useAuthStore()
  const { locale, currency } = useLocale()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)
  const { toast } = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadPlans(),
        loadCurrentSubscription(),
        loadPayments(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/plans', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    }
  }

  const loadCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscription', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentSubscription(data.subscription || null)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const loadPayments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setPayments([])
        return
      }

      const response = await fetch('/api/billing/history', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.history || [])
      } else {
        console.error('Error loading payment history:', response.statusText)
        setPayments([])
      }
    } catch (error) {
      console.error('Error loading payments:', error)
      setPayments([])
    }
  }

  const handleChangePlan = async (planId: string) => {
    if (!planId) return
    
    setChangingPlan(planId)
    try {
      const response = await fetch('/api/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ plan_id: planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao alterar plano')
      }

      toast({
        title: "Plano alterado",
        description: "Seu plano foi alterado com sucesso",
      })

      await loadCurrentSubscription()
      await loadPayments()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o plano",
        variant: "destructive",
      })
    } finally {
      setChangingPlan(null)
    }
  }

  const currentPlan = currentSubscription?.plan || null
  const currentPlanId = currentPlan?.id || null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold break-words">Cobrança</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Gerencie sua assinatura e histórico de pagamentos
        </p>
      </div>

      {/* Current Plan Summary */}
      {currentPlan && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg mb-1">
                  Plano {currentPlan.name}
                </CardTitle>
                <CardDescription>
                  {currentPlan.description || "Plano ativo"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pricing">Alterar plano</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Próxima cobrança</p>
                <p className="text-xl font-semibold">
                  {new Intl.NumberFormat(locale, { style: 'currency', currency }).format(currentPlan.price_monthly_cents / 100)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Limites</p>
                <p className="text-base font-medium">
                  {currentPlan.max_offers_visible ? `${currentPlan.max_offers_visible} ofertas/mês` : "Ilimitado"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Favoritos</p>
                <p className="text-base font-medium">
                  {currentPlan.max_favorites ? `${currentPlan.max_favorites}/mês` : "Ilimitado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trocar Plano</CardTitle>
          <CardDescription className="text-sm">
            Escolha o plano que melhor se adapta às suas necessidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId
              const isUpgrade = currentPlan && plan.price_monthly_cents > currentPlan.price_monthly_cents
              
              return (
                <Card
                  key={plan.id}
                  className={isCurrent ? "border-primary border-2" : "border"}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">{plan.description || ""}</CardDescription>
                    <div className="mt-3">
                      <span className="text-2xl font-bold">
                        {new Intl.NumberFormat(locale, { style: 'currency', currency }).format(plan.price_monthly_cents / 100)}
                      </span>
                      <span className="text-muted-foreground text-sm">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isCurrent ? (
                      <Button disabled className="w-full" size="sm">
                        Plano Atual
                      </Button>
                    ) : (
                      <Button
                        variant={isUpgrade ? "default" : "outline"}
                        className="w-full"
                        size="sm"
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={changingPlan === plan.id}
                      >
                        {changingPlan === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Alterando...
                          </>
                        ) : isUpgrade ? (
                          <>
                            <ArrowUp className="mr-2 h-4 w-4" />
                            Fazer Upgrade
                          </>
                        ) : (
                          <>
                            <ArrowDown className="mr-2 h-4 w-4" />
                            Fazer Downgrade
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Seus pagamentos e notas fiscais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle px-4 md:px-0">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {payment.type === 'credit_purchase' ? (
                          <CreditCard className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Package className="h-4 w-4 text-orange-500" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {payment.type === 'credit_purchase' ? 'Créditos' : 'Assinatura'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        {payment.credits_amount && (
                          <p className="text-xs text-muted-foreground">
                            {payment.credits_amount} créditos
                          </p>
                        )}
                        {payment.period_start && payment.period_end && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.period_start).toLocaleDateString('pt-BR')} - {new Date(payment.period_end).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: payment.currency || 'USD' 
                        }).format(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          payment.status === 'completed' || payment.status === 'paid' 
                            ? 'default' 
                            : payment.status === 'pending' 
                            ? 'secondary' 
                            : 'destructive'
                        }
                      >
                        {payment.status === 'completed' || payment.status === 'paid' 
                          ? 'Pago' 
                          : payment.status === 'pending' 
                          ? 'Pendente' 
                          : payment.status === 'failed' 
                          ? 'Falhou' 
                          : payment.status === 'refunded' 
                          ? 'Reembolsado' 
                          : payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">{payment.invoice}</span>
                    </TableCell>
                    <TableCell>
                      {payment.invoice_url ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          asChild
                        >
                          <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" disabled>
                          <Download className="h-4 w-4 opacity-50" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
            </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
