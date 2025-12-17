"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly_cents: number
  max_offers_visible: number | null
  max_favorites: number | null
  is_active: boolean
  created_at: string
}

export default function AdminPlansPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [editForm, setEditForm] = useState({
    price_monthly_cents: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
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
      } else {
        toast({
          title: "Erro ao carregar planos",
          description: "Não foi possível carregar os planos do banco de dados",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setEditForm({
      price_monthly_cents: plan.price_monthly_cents,
    })
  }

  const handleSave = async () => {
    if (!editingPlan) return

    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPlan.id,
          price_monthly_cents: editForm.price_monthly_cents,
        }),
      })

      if (response.ok) {
        toast({
          title: "Plano atualizado",
          description: "O plano foi atualizado com sucesso",
        })
        setEditingPlan(null)
        loadPlans()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar plano')
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o plano",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Planos</h1>
        <p className="text-muted-foreground">
          Configure os planos de assinatura do banco de dados
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum plano encontrado no banco de dados
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description || "Sem descrição"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(plan.price_monthly_cents)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    por mês
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Limites:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Ofertas: {plan.max_offers_visible === null ? "Ilimitado" : plan.max_offers_visible}</li>
                    <li>Favoritos: {plan.max_favorites === null ? "Ilimitado" : plan.max_favorites}</li>
                    <li>Status: {plan.is_active ? "Ativo" : "Inativo"}</li>
                  </ul>
                </div>
                <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" onClick={() => handleEdit(plan)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Plano: {plan.name}</DialogTitle>
                      <DialogDescription>
                        Atualize o preço do plano
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Preço Mensal (em centavos)</Label>
                        <Input 
                          type="number" 
                          value={editForm.price_monthly_cents}
                          onChange={(e) => setEditForm({ ...editForm, price_monthly_cents: parseInt(e.target.value) || 0 })}
                          placeholder="Ex: 4900 para R$ 49,00"
                        />
                        <p className="text-sm text-muted-foreground">
                          Valor atual: {formatCurrency(editForm.price_monthly_cents)}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingPlan(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

