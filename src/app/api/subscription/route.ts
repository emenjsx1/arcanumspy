import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Forçar Node runtime, necessário para supabase.auth.getUser()
export const runtime = 'nodejs'

// Tipagem das tabelas
type Plan = {
  id: string
  name: string
  price: number
}

type Subscription = {
  id: string
  user_id: string
  plan_id: string
  status: string
  current_period_end: string
  created_at: string
  updated_at: string
  plan?: Plan
}

// GET: Buscar assinatura ativa do usuário
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: subscription, error } = await supabase
      .from<Subscription>('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error

    // Fallback caso não exista assinatura
    return NextResponse.json({ subscription: subscription ?? null })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao buscar assinatura"
    console.error('Error fetching subscription:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT: Atualizar ou criar assinatura do usuário
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body: { plan_id?: string } = await request.json()
    const plan_id = body.plan_id

    if (!plan_id) {
      return NextResponse.json({ error: "plan_id é obrigatório" }, { status: 400 })
    }

    // Buscar assinatura atual
    const { data: currentSubscription, error: fetchError } = await supabase
      .from<Subscription>('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (fetchError) throw fetchError

    // Calcular período final (30 dias a partir de agora)
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

    let subscription: Subscription

    if (currentSubscription) {
      if (!currentSubscription.id) {
        throw new Error("Assinatura inválida: id não encontrado")
      }

      // Atualizar assinatura existente
      const { data, error } = await supabase
        .from<Subscription>('subscriptions')
        .update({
          plan_id,
          current_period_end: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id)
        .select(`
          *,
          plan:plans(*)
        `)
        .single()

      if (error) throw error
      subscription = data
    } else {
      // Criar nova assinatura
      const { data, error } = await supabase
        .from<Subscription>('subscriptions')
        .insert({
          user_id: user.id,
          plan_id,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
        })
        .select(`
          *,
          plan:plans(*)
        `)
        .single()

      if (error) throw error
      subscription = data
    }

    return NextResponse.json({ subscription })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar plano"
    console.error('Error updating subscription:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
