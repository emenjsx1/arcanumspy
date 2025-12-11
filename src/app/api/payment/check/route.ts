import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // Se não conseguir via cookies, tentar via header
    if (!user && authError) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        const { data: { user: userFromToken } } = await tempClient.auth.getUser(token)
        if (userFromToken) {
          user = userFromToken
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { hasActivePayment: false },
        { status: 401 }
      )
    }

    // Verificar se tem pagamento confirmado
    const adminClient = createAdminClient()
    let payment = null
    let subscription = null
    
    try {
      // Tentar buscar pagamento (pode não existir tabela)
      const { data: paymentData } = await (adminClient
        .from('payments') as any)
        .select('id, status, paid_at, period_end')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed', 'paid'])
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      payment = paymentData
    } catch (e) {
      // Tabela pode não existir
    }

    try {
      // Verificar subscription ativa
      const { data: subData } = await (adminClient
        .from('subscriptions') as any)
        .select('id, status, current_period_end, trial_ends_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      subscription = subData
    } catch (e) {
      // Tabela pode não existir
    }

    // Verificar se subscription não expirou (usar current_period_end ou trial_ends_at)
    const subscriptionEndDate = subscription?.current_period_end || subscription?.trial_ends_at
    const hasActiveSubscription = subscription && subscriptionEndDate && (
      new Date(subscriptionEndDate) > new Date()
    )

    // Verificar perfil para subscription_ends_at
    let profileSubscriptionEnd = null
    try {
      const { data: profile } = await (adminClient
        .from('profiles') as any)
        .select('has_active_subscription, subscription_ends_at')
        .eq('id', user.id)
        .single()
      
      if (profile?.has_active_subscription && profile?.subscription_ends_at) {
        profileSubscriptionEnd = new Date(profile.subscription_ends_at) > new Date()
      }
    } catch (e) {
      // Ignorar erro
    }

    const hasActivePayment = !!(payment || hasActiveSubscription || profileSubscriptionEnd)

    return NextResponse.json({
      hasActivePayment,
      hasPayment: !!payment,
      hasSubscription: hasActiveSubscription
    })
  } catch (error: any) {
    return NextResponse.json({
      hasActivePayment: false,
      hasPayment: false,
      hasSubscription: false
    })
  }
}

