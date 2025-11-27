"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/store/auth-store"
import { Download, ArrowUp, ArrowDown, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Plan {
  id: string
  name: string
  slug: string
  description?: string | null
  price_monthly_cents: number
}

interface CurrentSubscription {
  plan?: Plan
}

export default function BillingPage() {
  const { profile, user } = useAuthStore()
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
      // TODO: Implementar quando tiver a tabela payments
      setPayments([])
    } catch (error) {
      console.error('Error loading payments:', error)
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
        <h1 className="text-2xl font-semibold">Cobrança</h1>
        <p className="text-sm text-muted-foreground">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Próxima cobrança</p>
                <p className="text-xl font-semibold">
                  {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(currentPlan.price_monthly_cents / 100)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(plan.price_monthly_cents / 100)}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Plano</TableHead>
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
                      {new Date(payment.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{payment.plan}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.status}</Badge>
                    </TableCell>
                    <TableCell>{payment.invoice}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
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
