"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CurrencySelector } from "@/components/currency-selector"
import { useCurrency } from "@/contexts/locale-context"
import { supabase } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Transacao {
  id: string
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: number
  categoria: string
  data: string
  created_at: string
}

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [receitas, setReceitas] = useState(0)
  const [despesas, setDespesas] = useState(0)
  const [saldo, setSaldo] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'receita' as 'receita' | 'despesa',
    descricao: "",
    valor: "",
    categoria: "outros",
    data: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { formatPrice, currency, currencySymbol } = useCurrency()

  useEffect(() => {
    loadFinanceiro()
  }, [])

  const loadFinanceiro = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      const response = await fetch('/api/produtividade/financeiro', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransacoes(data.transacoes || [])
        setReceitas(data.receitas || 0)
        setDespesas(data.despesas || 0)
        setSaldo(data.saldo || 0)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados financeiros",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      const response = await fetch('/api/produtividade/financeiro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          tipo: formData.tipo,
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          categoria: formData.categoria,
          data: formData.data
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Transação criada com sucesso!",
        })
        setOpenDialog(false)
        setFormData({
          tipo: 'receita',
          descricao: "",
          valor: "",
          categoria: "outros",
          data: new Date().toISOString().split('T')[0]
        })
        loadFinanceiro()
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar transação",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar transação",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/produtividade/financeiro?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Transação excluída com sucesso!",
        })
        loadFinanceiro()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir transação",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive"
      })
    }
  }

  const formatCurrencyValue = useCallback(async (value: number) => {
    // Converter valor em centavos para a moeda selecionada
    // Usar MZN como moeda base (padrão) em vez de BRL
    const cents = Math.round(value * 100)
    return await formatPrice(cents, 'MZN', currency)
  }, [formatPrice, currency])

  const [formattedReceitas, setFormattedReceitas] = useState('')
  const [formattedDespesas, setFormattedDespesas] = useState('')
  const [formattedSaldo, setFormattedSaldo] = useState('')

  useEffect(() => {
    const updateFormattedValues = async () => {
      if (receitas !== undefined) {
        const formatted = await formatCurrencyValue(receitas)
        setFormattedReceitas(formatted)
      }
      if (despesas !== undefined) {
        const formatted = await formatCurrencyValue(despesas)
        setFormattedDespesas(formatted)
      }
      if (saldo !== undefined) {
        const formatted = await formatCurrencyValue(saldo)
        setFormattedSaldo(formatted)
      }
    }
    updateFormattedValues()
  }, [receitas, despesas, saldo, formatCurrencyValue])

  const categorias = [
    { value: 'vendas', label: 'Vendas' },
    { value: 'servicos', label: 'Serviços' },
    { value: 'investimentos', label: 'Investimentos' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'infraestrutura', label: 'Infraestrutura' },
    { value: 'pessoal', label: 'Pessoal' },
    { value: 'outros', label: 'Outros' },
  ]

  function FormattedValue({ value, tipo }: { value: number; tipo: 'receita' | 'despesa' }) {
    const [formatted, setFormatted] = useState('...')
    
    useEffect(() => {
      formatCurrencyValue(value).then(setFormatted).catch(() => {
        // Fallback usando a moeda selecionada
        const fallbackSymbol = currencySymbol || 'MT'
        setFormatted(`${fallbackSymbol} ${value.toFixed(2)}`)
      })
    }, [value, currency, currencySymbol, formatCurrencyValue])
    
    return (
      <p
        className={`text-base md:text-lg font-bold ${
          tipo === 'receita' ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {tipo === 'receita' ? '+' : '-'}
        {formatted}
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff5a1f] rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Financeiro</h1>
              <p className="text-gray-400 text-sm md:text-base lg:text-lg">Gerencie suas finanças</p>
            </div>
          </div>
          <CurrencySelector />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-green-500">{formattedReceitas || '...'}</p>
            <p className="text-sm text-gray-400 mt-2">Total acumulado</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-red-500">{formattedDespesas || '...'}</p>
            <p className="text-sm text-gray-400 mt-2">Total acumulado</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#ff5a1f]" />
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl md:text-2xl lg:text-3xl font-bold ${saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formattedSaldo || '...'}
            </p>
            <p className="text-sm text-gray-400 mt-2">Saldo atual</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
              <DialogDescription className="text-gray-400">
                Adicione uma nova receita ou despesa
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as 'receita' | 'despesa' })}
                >
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Venda de produto"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor ({currencySymbol})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0.00"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Transação
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#2a2a2a] rounded animate-pulse" />
              ))}
            </div>
          ) : transacoes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhuma transação encontrada</p>
          ) : (
            <div className="space-y-2">
              {transacoes.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 md:p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-[#ff5a1f] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <Badge
                        variant={transacao.tipo === 'receita' ? 'default' : 'destructive'}
                        className={`${transacao.tipo === 'receita' ? 'bg-green-500' : 'bg-red-500'} text-xs`}
                      >
                        {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm md:text-base break-words">{transacao.descricao}</p>
                        <p className="text-gray-400 text-xs md:text-sm">
                          {categorias.find(c => c.value === transacao.categoria)?.label || transacao.categoria} •{' '}
                          {new Date(transacao.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <FormattedValue value={transacao.valor} tipo={transacao.tipo} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(transacao.id)}
                      className="text-gray-400 hover:text-red-500 h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
