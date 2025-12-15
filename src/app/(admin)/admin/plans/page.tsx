"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Loader2, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface Plan {
  id: string
  name: string
  slug: string
  description?: string | null
  price_monthly_cents: number
  max_offers_visible?: number | null
  max_favorites?: number | null
  is_active: boolean
  created_at: string
}

export default function AdminPlansPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plans', {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Erro ao carregar planos')
      }
      
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingPlan) return

    try {
      // TODO: Implementar API para atualizar plano
      toast({
        title: "Em desenvolvimento",
        description: "A funcionalidade de edição será implementada em breve",
      })
      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as alterações",
        variant: "destructive",
      })
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Planos</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura disponíveis
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum plano encontrado</p>
            <Button className="mt-4" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {!plan.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
                <CardDescription>{plan.description || "Sem descrição"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">
                    {formatPrice(plan.price_monthly_cents)}/mês
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug: {plan.slug}
                  </p>
                </div>
                
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Limites:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      Ofertas: {plan.max_offers_visible === null || plan.max_offers_visible === undefined 
                        ? "Ilimitado" 
                        : plan.max_offers_visible}
                    </li>
                    <li>
                      Favoritos: {plan.max_favorites === null || plan.max_favorites === undefined 
                        ? "Ilimitado" 
                        : plan.max_favorites}
                    </li>
                  </ul>
                </div>

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <p>Criado em: {new Date(plan.created_at).toLocaleDateString('pt-BR')}</p>
                </div>

                <Dialog open={isDialogOpen && editingPlan?.id === plan.id} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Plano: {editingPlan?.name}</DialogTitle>
                      <DialogDescription>
                        Atualize as configurações do plano
                      </DialogDescription>
                    </DialogHeader>
                    {editingPlan && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input 
                            type="text" 
                            defaultValue={editingPlan.name}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug</Label>
                          <Input 
                            type="text" 
                            defaultValue={editingPlan.slug}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Input 
                            type="text" 
                            defaultValue={editingPlan.description || ""}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço Mensal (em centavos)</Label>
                          <Input 
                            type="number" 
                            defaultValue={editingPlan.price_monthly_cents}
                            disabled
                          />
                          <p className="text-xs text-muted-foreground">
                            Valor atual: {formatPrice(editingPlan.price_monthly_cents)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Máximo de Ofertas Visíveis</Label>
                          <Input 
                            type="number" 
                            defaultValue={editingPlan.max_offers_visible || ""}
                            placeholder="Deixe vazio para ilimitado"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Máximo de Favoritos</Label>
                          <Input 
                            type="number" 
                            defaultValue={editingPlan.max_favorites || ""}
                            placeholder="Deixe vazio para ilimitado"
                            disabled
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Fechar
                      </Button>
                      <Button onClick={handleSave} disabled>
                        Salvar (Em desenvolvimento)
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
