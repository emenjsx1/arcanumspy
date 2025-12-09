"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, Loader2 } from "lucide-react"
import { useTranslation, useCurrency } from "@/contexts/locale-context"

interface Plan {
  id: string
  name: string
  slug: string
  description?: string | null
  price_monthly_cents: number
  max_offers_visible?: number | null
  max_favorites?: number | null
}

export default function PricingPage() {
  const t = useTranslation()
  const { formatPrice } = useCurrency()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState<Record<string, { monthly: string }>>({})

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    // Carregar preços convertidos quando plans mudarem
    if (plans.length > 0) {
      loadPrices()
    }
  }, [plans, formatPrice])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPrices = async () => {
    const priceMap: Record<string, { monthly: string }> = {}
    
    for (const plan of plans) {
      // Mostrar preços em USD (moeda base)
      const monthlyPrice = await formatPrice(plan.price_monthly_cents, 'USD', 'USD')
      priceMap[plan.id] = { monthly: monthlyPrice }
    }
    
    setPrices(priceMap)
  }

  const getPlanFeatures = (plan: Plan): string[] => {
    const features: string[] = []
    
    if (plan.max_offers_visible) {
      features.push(`${plan.max_offers_visible} ofertas por mês`)
    } else {
      features.push('Ofertas ilimitadas')
    }
    
    if (plan.max_favorites) {
      features.push(`${plan.max_favorites} favoritos`)
    } else {
      features.push('Favoritos ilimitados')
    }
    
    features.push('Acesso a todas as categorias')
    features.push('Suporte por email')
    
    return features
  }

  if (loading) {
    return (
      <div className="container py-24 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">{t.pricing.title}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.pricing.subtitle}
        </p>
      </div>

      {/* Plans */}
      {plans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const planPrices = prices[plan.id] || { monthly: '...' }
            const isPopular = index === Math.floor(plans.length / 2) // Plano do meio como popular
            const features = getPlanFeatures(plan)
            
            return (
              <Card
                key={plan.id}
                className={isPopular ? "border-primary border-2 relative" : ""}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {t.pricing.popular}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description || ""}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">{planPrices.monthly}</span>
                    <span className="text-muted-foreground">{t.pricing.perMonth}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/signup?plan=${plan.slug || plan.id}`}>
                    <Button
                      className="w-full"
                      size="lg"
                      variant={isPopular ? "default" : "outline"}
                    >
                      {t.pricing.startNow}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{t.pricing.faq}</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>{t.pricing.canChangePlan}</AccordionTrigger>
            <AccordionContent>
              {t.pricing.canChangePlanAnswer}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>{t.pricing.annualDiscount}</AccordionTrigger>
            <AccordionContent>
              {t.pricing.annualDiscountAnswer}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>{t.pricing.medicalPlans}</AccordionTrigger>
            <AccordionContent>
              {t.pricing.medicalPlansAnswer}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
