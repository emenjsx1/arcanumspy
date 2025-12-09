"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Plus, Trash2, Loader2, Target, CheckCircle2 } from "lucide-react"
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

interface Meta {
  id: string
  titulo: string
  descricao?: string
  valor_atual: number
  valor_objetivo: number
  unidade: string
  prazo?: string
  concluida: boolean
  created_at: string
}

export default function MetaPage() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    valor_objetivo: "",
    valor_atual: "0",
    unidade: "unidade",
    prazo: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { formatPrice, currency } = useCurrency()

  useEffect(() => {
    loadMetas()
  }, [])

  const loadMetas = async () => {
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

      const response = await fetch('/api/produtividade/metas', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMetas(data.metas || [])
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar metas",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar metas",
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

      const response = await fetch('/api/produtividade/metas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          valor_objetivo: parseFloat(formData.valor_objetivo),
          valor_atual: parseFloat(formData.valor_atual) || 0,
          unidade: formData.unidade,
          prazo: formData.prazo || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Meta criada com sucesso!",
        })
        setOpenDialog(false)
        setFormData({
          titulo: "",
          descricao: "",
          valor_objetivo: "",
          valor_atual: "0",
          unidade: "unidade",
          prazo: ""
        })
        loadMetas()
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar meta",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar meta",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleConcluida = async (meta: Meta) => {
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

      const response = await fetch(`/api/produtividade/metas?id=${meta.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          concluida: !meta.concluida,
          valor_objetivo: meta.valor_objetivo
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: meta.concluida ? "Meta marcada como não concluída!" : "Meta marcada como concluída!",
        })
        loadMetas()
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar meta",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar meta:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar meta",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return

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

      const response = await fetch(`/api/produtividade/metas?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Meta excluída com sucesso!",
        })
        loadMetas()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir meta",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao excluir meta:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir meta",
        variant: "destructive"
      })
    }
  }

  const calcularProgresso = (atual: number, objetivo: number, concluida: boolean) => {
    if (concluida) return 100
    if (objetivo === 0) return 0
    return Math.min((atual / objetivo) * 100, 100)
  }

  function FormattedMetaValue({ atual, objetivo, unidade }: { atual: number; objetivo: number; unidade: string }) {
    const [formatted, setFormatted] = useState(`${atual.toFixed(2)} ${unidade} / ${objetivo.toFixed(2)} ${unidade}`)
    
    useEffect(() => {
      if (unidade === 'reais' || unidade === 'R$') {
        Promise.all([
          formatCurrencyValue(atual).catch(() => `R$ ${atual.toFixed(2)}`),
          formatCurrencyValue(objetivo).catch(() => `R$ ${objetivo.toFixed(2)}`)
        ]).then(([fAtual, fObjetivo]) => {
          setFormatted(`${fAtual} / ${fObjetivo}`)
        })
      } else {
        setFormatted(`${atual.toFixed(2)} ${unidade} / ${objetivo.toFixed(2)} ${unidade}`)
      }
    }, [atual, objetivo, unidade, currency])
    
    return <span className="text-white font-semibold">{formatted}</span>
  }

  const formatCurrencyValue = async (value: number) => {
    const cents = Math.round(value * 100)
    return await formatPrice(cents, 'BRL')
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff5a1f] rounded-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Metas</h1>
              <p className="text-gray-400 text-sm md:text-base lg:text-lg">Acompanhe suas metas e objetivos</p>
            </div>
          </div>
          <CurrencySelector />
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
              <DialogDescription className="text-gray-400">
                Defina uma nova meta para acompanhar seu progresso
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Vender 100 produtos"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva sua meta..."
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Objetivo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_objetivo}
                    onChange={(e) => setFormData({ ...formData, valor_objetivo: e.target.value })}
                    placeholder="100"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select
                    value={formData.unidade}
                    onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                  >
                    <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="unidade">Unidade</SelectItem>
                      <SelectItem value="reais">R$</SelectItem>
                      <SelectItem value="porcentagem">%</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo (opcional)</Label>
                <Input
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                />
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
                    Criar Meta
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="h-6 bg-[#2a2a2a] rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-[#2a2a2a] rounded animate-pulse mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metas.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma meta criada ainda</p>
            <p className="text-gray-500 text-sm mt-2">Crie sua primeira meta para começar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {metas.map((meta) => {
            const progresso = calcularProgresso(meta.valor_atual, meta.valor_objetivo, meta.concluida)
            return (
              <Card key={meta.id} className={`bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f] transition-colors ${meta.concluida ? 'opacity-75' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className={`text-white ${meta.concluida ? 'line-through' : ''}`}>{meta.titulo}</CardTitle>
                        {meta.concluida && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      {meta.descricao && (
                        <p className="text-gray-400 text-sm mt-1">{meta.descricao}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleConcluida(meta)}
                        className={`text-gray-400 hover:text-green-500 ${meta.concluida ? 'text-green-500' : ''}`}
                        title={meta.concluida ? "Marcar como não concluída" : "Marcar como concluída"}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(meta.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Progresso</span>
                        <span className="text-white font-semibold">
                          {meta.valor_atual.toFixed(2)} {meta.unidade} / {meta.valor_objetivo.toFixed(2)} {meta.unidade}
                        </span>
                      </div>
                      <div className="w-full bg-[#0a0a0a] rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${meta.concluida ? 'bg-green-500' : 'bg-[#ff5a1f]'}`}
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1 ${meta.concluida ? 'text-green-500 font-semibold' : 'text-gray-400'}`}>
                        {meta.concluida ? '100% Concluído!' : `${progresso.toFixed(1)}% concluído`}
                      </p>
                    </div>
                    {meta.prazo && (
                      <p className="text-gray-500 text-xs">
                        Prazo: {new Date(meta.prazo).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
