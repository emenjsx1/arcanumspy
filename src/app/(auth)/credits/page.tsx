"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ShoppingCart,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  DollarSign
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CreditBalance {
  balance: number
  total_loaded: number
  total_consumed: number
  is_blocked: boolean
  low_balance_threshold: number
}

interface CreditPackage {
  id: string
  name: string
  credits: number
  price_cents: number
  currency: string
  bonus_credits: number
  description: string | null
}

interface CreditTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  balance_after: number
  category: string
  description: string | null
  created_at: string
  metadata?: any
  package?: {
    id: string
    name: string
    credits: number
    price_cents: number
    currency: string
    bonus_credits: number
  } | null
}

export default function CreditsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [customCredits, setCustomCredits] = useState<number>(100)
  const [showCustomInput, setShowCustomInput] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Não autenticado",
          description: "Faça login para acessar",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/credits', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar créditos')
      }

      const data = await response.json()
      if (data.success) {
        setBalance(data.balance)
        setPackages(data.packages || [])
        
        // Verificar alertas
        if (data.balance.balance < 0) {
          toast({
            title: "Saldo Negativo",
            description: `Seu saldo está negativo: ${data.balance.balance} créditos. Carregue créditos para continuar usando a plataforma.`,
            variant: "destructive",
          })
        } else if (data.balance.balance <= data.balance.low_balance_threshold) {
          toast({
            title: "Saldo Baixo",
            description: `Seu saldo está baixo: ${data.balance.balance} créditos. Considere carregar mais créditos.`,
          })
        }

        await loadTransactions()
      }
    } catch (error: any) {
      console.error('Error loading credits:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar créditos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch('/api/credits/transactions?limit=50', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTransactions(data.transactions || [])
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handlePurchase = async (pkg: CreditPackage, customAmount?: number) => {
    setSelectedPackage(pkg)
    setPurchasing(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Não autenticado",
          description: "Faça login para continuar",
          variant: "destructive",
        })
        return
      }

      // Se for compra customizada, calcular preço proporcional
      const creditsToBuy = customAmount || pkg.credits
      const pricePerCredit = pkg.price_cents / pkg.credits
      const totalPrice = Math.round(pricePerCredit * creditsToBuy)

      // MODO DEMO: Adicionar créditos diretamente sem gateway de pagamento
      toast({
        title: "Adicionando créditos...",
        description: "Créditos serão adicionados à sua conta",
      })

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = await fetch('/api/credits', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          package_id: pkg.id,
          payment_id: `demo_payment_${Date.now()}`, // ID demo
          custom_credits: customAmount, // Quantidade customizada
          custom_price_cents: customAmount ? totalPrice : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Créditos carregados!",
          description: `Você recebeu ${creditsToBuy} créditos.`,
        })
        await loadData()
        setSelectedPackage(null)
        setShowCustomInput(false)
        setCustomCredits(100)
      } else {
        throw new Error(data.error || "Erro ao processar pagamento")
      }
    } catch (error: any) {
      console.error('Error purchasing credits:', error)
      toast({
        title: "Erro ao comprar",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      })
    } finally {
      setPurchasing(false)
    }
  }

  const calculateCustomPrice = (credits: number, pkg: CreditPackage) => {
    const pricePerCredit = pkg.price_cents / pkg.credits
    return Math.round(pricePerCredit * credits)
  }

  const formatCurrency = (cents: number, currency: string = 'MZN') => {
    const value = cents / 100
    if (currency === 'MZN') {
      return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value)
    }
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
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
      'offer_view': 'Visualização de Oferta',
      'copy_generation': 'Geração de Copy',
      'audio_generation': 'Geração de Áudio',
      'bonus': 'Bônus',
      'refund': 'Reembolso'
    }
    return labels[category] || category
  }

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
        <h1 className="text-3xl font-bold">Meus Créditos</h1>
        <p className="text-muted-foreground">
          Gerencie seus créditos e monitore seu consumo
        </p>
      </div>

      {/* Alerta de saldo negativo */}
      {balance && balance.balance < 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Saldo Negativo</p>
                <p className="text-sm text-muted-foreground">
                  Seu saldo está negativo: {balance.balance} créditos. Carregue créditos para continuar usando a plataforma.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Disponíveis</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.balance || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Carregado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {balance?.total_loaded || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Créditos comprados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumido</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {balance?.total_consumed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Créditos utilizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pacotes de Créditos */}
      <Card>
        <CardHeader>
          <CardTitle>Carregar Créditos</CardTitle>
          <CardDescription>
            Escolha um pacote ou defina uma quantidade personalizada de créditos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Opção de Compra Customizada */}
          <Card className="mb-6 border-2 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Compra Personalizada</CardTitle>
              <CardDescription>
                Escolha quantos créditos você deseja comprar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-credits">Quantidade de Créditos</Label>
                <Input
                  id="custom-credits"
                  type="number"
                  min="1"
                  step="1"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-lg"
                />
              </div>
              {packages.length > 0 && (
                <div className="space-y-2">
                  <Label>Preço Estimado (baseado no pacote mais barato)</Label>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(calculateCustomPrice(customCredits, packages[0]), packages[0].currency)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Preço por crédito: {formatCurrency(Math.round(packages[0].price_cents / packages[0].credits), packages[0].currency)}
                  </p>
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => packages.length > 0 && handlePurchase(packages[0], customCredits)}
                disabled={purchasing || customCredits < 1}
              >
                {purchasing && selectedPackage?.id === packages[0]?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Comprar {customCredits} Créditos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pacotes Pré-definidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pacotes Pré-definidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => {
                const totalCredits = pkg.credits + (pkg.bonus_credits || 0)
                return (
                  <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold">{pkg.credits}</div>
                        {pkg.bonus_credits > 0 && (
                          <div className="text-sm text-green-600 font-semibold">
                            +{pkg.bonus_credits} bônus = {totalCredits} créditos
                          </div>
                        )}
                        <div className="text-2xl font-bold text-primary mt-2">
                          {formatCurrency(pkg.price_cents, pkg.currency)}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing}
                      >
                        {purchasing && selectedPackage?.id === pkg.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Comprar
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Veja todas as suas transações de créditos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Pacote</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Saldo Após</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        {transaction.type === 'credit' ? (
                          <Badge variant="default" className="bg-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Crédito
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <TrendingDown className="h-3 w-3 mr-1" />
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
                      <TableCell className="text-sm">
                        {transaction.package ? (
                          <div>
                            <div className="font-medium">{transaction.package.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.package.credits} créditos
                              {transaction.package.bonus_credits > 0 && ` + ${transaction.package.bonus_credits} bônus`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(transaction.package.price_cents, transaction.package.currency)}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}




