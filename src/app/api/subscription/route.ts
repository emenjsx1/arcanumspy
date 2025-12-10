import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"

// Forçar Node runtime, necessário para supabase.auth.getUser()
export const runtime = 'nodejs'

// Tipos do banco de dados
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
type PlanRow = Database['public']['Tables']['plans']['Row']

// Tipo para assinatura com plano relacionado
type SubscriptionWithPlan = SubscriptionRow & {
  plan: PlanRow | null
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
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('Error fetching subscription:', error)
      throw error
    }

    // Fallback caso não exista assinatura
    return NextResponse.json({ 
      subscription: subscription as SubscriptionWithPlan | null 
    })
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
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching current subscription:', fetchError)
      throw fetchError
    }

    // Calcular período final (30 dias a partir de agora)
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)
    const currentPeriodEndISO = currentPeriodEnd.toISOString()
    const nowISO = new Date().toISOString()

    let subscription: SubscriptionWithPlan

    if (currentSubscription) {
      // Atualizar assinatura existente
      const subscriptionId = (currentSubscription as SubscriptionRow).id
      const updatePayload: any = {
        plan_id,
        current_period_end: currentPeriodEndISO,
        updated_at: nowISO,
      }
      const { data, error } = await (supabase.from('subscriptions') as any)
        .update(updatePayload)
        .eq('id', subscriptionId)
        .select(`
          *,
          plan:plans(*)
        `)
        .single()

      if (error) {
        console.error('Error updating subscription:', error)
        throw error
      }
      
      if (!data) {
        throw new Error("Erro ao atualizar assinatura: dados não retornados")
      }
      
      subscription = data as SubscriptionWithPlan
    } else {
      // Criar nova assinatura
      const insertPayload: any = {
        user_id: user.id,
        plan_id,
        status: 'active',
        started_at: nowISO,
        current_period_end: currentPeriodEndISO,
      }
      const { data, error } = await (supabase.from('subscriptions') as any)
        .insert(insertPayload)
        .select(`
          *,
          plan:plans(*)
        `)
        .single()

      if (error) {
        console.error('Error creating subscription:', error)
        throw error
      }
      
      if (!data) {
        throw new Error("Erro ao criar assinatura: dados não retornados")
      }
      
      subscription = data as SubscriptionWithPlan
    }

    return NextResponse.json({ subscription })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar plano"
    console.error('Error updating subscription:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
