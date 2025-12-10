import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/billing/history
 * Obter histórico completo de compras/assinaturas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Tentar obter usuário
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se não funcionou, tentar via header Authorization
    if (authError || !user) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
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
          authError = null
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const history: any[] = []

    // 1. Buscar pagamentos de assinaturas (tabela payments)
    try {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          plan:plans(name, slug, price_monthly_cents)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!paymentsError && payments) {
        payments.forEach((payment: any) => {
          history.push({
            id: payment.id,
            type: 'subscription',
            date: payment.paid_at || payment.created_at,
            description: `Assinatura - ${payment.plan?.name || 'Plano'}`,
            plan: payment.plan?.name || 'N/A',
            amount: payment.amount_cents / 100,
            currency: payment.currency || 'USD',
            status: payment.status,
            invoice: payment.invoice_number || `#INV-${payment.id.substring(0, 8).toUpperCase()}`,
            invoice_url: payment.invoice_url,
            payment_method: payment.payment_method,
            period_start: payment.period_start,
            period_end: payment.period_end,
          })
        })
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar payments:', error)
    }

    // 2. Buscar histórico de assinaturas (tabela subscriptions)
    try {
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(name, slug, price_monthly_cents)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!subscriptionsError && subscriptions) {
        subscriptions.forEach((sub: any) => {
          // Só adicionar se não existir um payment correspondente
          const hasPayment = history.some(h => h.type === 'subscription' && h.id === sub.id)
          if (!hasPayment) {
            history.push({
              id: sub.id,
              type: 'subscription',
              date: sub.started_at || sub.created_at,
              description: `Assinatura - ${sub.plan?.name || 'Plano'}`,
              plan: sub.plan?.name || 'Free',
              amount: (sub.plan?.price_monthly_cents || 0) / 100,
              currency: 'USD',
              status: sub.status === 'active' ? 'completed' : sub.status || 'pending',
              invoice: `#INV-${sub.id.substring(0, 8).toUpperCase()}`,
              period_start: sub.started_at,
              period_end: sub.ends_at,
            })
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar subscriptions:', error)
    }

    // Sistema baseado em planos - não há mais compras de créditos

    // Ordenar por data (mais recente primeiro)
    history.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      history,
      total: history.length
    })
  } catch (error: any) {
    console.error('❌ Erro em GET /api/billing/history:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao obter histórico" },
      { status: 500 }
    )
  }
}


