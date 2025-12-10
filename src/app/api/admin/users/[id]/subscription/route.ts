import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Database } from "@/types/database"

type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const { plan_id } = await request.json()
    const targetUserId = params.id

    if (!plan_id) {
      return NextResponse.json(
        { error: "plan_id é obrigatório" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get current subscription
    const { data: currentSubscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .maybeSingle()

    // Calculate period end (30 days from now)
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

    let subscription
    
    if (currentSubscription) {
      // Update existing subscription
      const updateData: SubscriptionUpdate = {
        plan_id,
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }
      const subscriptionId = (currentSubscription as any).id
      const { data, error } = await (adminClient
        .from('subscriptions') as any)
        .update(updateData)
        .eq('id', subscriptionId)
        .select(`
          *,
          plan:plans(*)
        `)
        .single()

      if (error) throw error
      subscription = data
    } else {
      // Create new subscription
      const { data, error } = await adminClient
        .from('subscriptions')
        .insert({
          user_id: targetUserId,
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
  } catch (error: any) {
    console.error('Error updating user subscription:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar plano do usuário" },
      { status: 500 }
    )
  }
}














