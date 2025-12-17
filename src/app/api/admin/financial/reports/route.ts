/**
 * API Route: GET /api/admin/financial/reports
 * 
 * Gera relatórios financeiros completos
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedServer } from "@/lib/auth/isAuthenticated"

export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authenticated = await isAuthenticatedServer(request)
    if (!authenticated) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
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
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Verificar se é admin
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

    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // 'day', 'week', 'month', 'year', 'all'

    // Calcular datas baseado no período
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0) // All time
    }

    // 1. Relatório de Receitas
    // Buscar todos os pagamentos confirmados
    const { data: allPayments } = await adminClient
      .from('payments')
      .select(`
        *,
        plan:plans(name, slug)
      `)
      .in('status', ['paid', 'completed'])
      .order('paid_at', { ascending: false, nullsFirst: true })

    // Filtrar por período (usar paid_at se disponível, senão created_at)
    const payments = (allPayments || []).filter((p: any) => {
      if (period === 'all') return true
      const paymentDate = p.paid_at ? new Date(p.paid_at) : new Date(p.created_at)
      return paymentDate >= startDate
    })

    const totalRevenue = (payments || []).reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)

    // Receita por plano
    const revenueByPlan: Record<string, { name: string; amount: number; count: number }> = {}
    payments?.forEach((p: any) => {
      const planName = p.plan?.name || 'Sem Plano'
      if (!revenueByPlan[planName]) {
        revenueByPlan[planName] = { name: planName, amount: 0, count: 0 }
      }
      revenueByPlan[planName].amount += p.amount_cents || 0
      revenueByPlan[planName].count += 1
    })

    // 2. Relatório de Assinaturas
    const { data: subscriptions } = await adminClient
      .from('subscriptions')
      .select(`
        *,
        plan:plans(name, slug, price_monthly_cents)
      `)
      .gte('created_at', startDate.toISOString())

    const activeSubscriptions = (subscriptions || []).filter((s: any) => s.status === 'active').length
    const cancelledSubscriptions = (subscriptions || []).filter((s: any) => s.status === 'canceled').length

    // Assinaturas por plano
    const subscriptionsByPlan: Record<string, { name: string; count: number; active: number }> = {}
    subscriptions?.forEach((s: any) => {
      const planName = s.plan?.name || 'Sem Plano'
      if (!subscriptionsByPlan[planName]) {
        subscriptionsByPlan[planName] = { name: planName, count: 0, active: 0 }
      }
      subscriptionsByPlan[planName].count += 1
      if (s.status === 'active') {
        subscriptionsByPlan[planName].active += 1
      }
    })

    // 3. Relatório de Pagamentos Pendentes
    const { data: pendingPayments } = await adminClient
      .from('payments')
      .select(`
        *,
        plan:plans(name),
        user:profiles(name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    const totalPending = (pendingPayments || []).reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)

    // 4. Relatório de Renovações (próximos 30 dias)
    const next30Days = new Date(now)
    next30Days.setDate(now.getDate() + 30)

    const { data: upcomingRenewals } = await adminClient
      .from('subscriptions')
      .select(`
        *,
        plan:plans(name, price_monthly_cents),
        user:profiles(name, email)
      `)
      .eq('status', 'active')
      .gte('current_period_end', now.toISOString())
      .lte('current_period_end', next30Days.toISOString())
      .order('current_period_end', { ascending: true })

    // 5. Relatório de Usuários sem Pagamento
    const { data: allSubscriptions } = await adminClient
      .from('subscriptions')
      .select(`
        *,
        plan:plans(name, price_monthly_cents),
        user:profiles(name, email)
      `)
      .eq('status', 'active')

    const { data: allPaymentsForUsers } = await adminClient
      .from('payments')
      .select('user_id, status')
      .in('status', ['paid', 'completed'])

    const usersWithPayments = new Set(allPaymentsForUsers?.map((p: any) => p.user_id) || [])
    const usersWithoutPayment = (allSubscriptions || []).filter((s: any) => {
      const hasPaidPlan = s.plan?.price_monthly_cents > 0
      return hasPaidPlan && !usersWithPayments.has(s.user_id)
    })

    return NextResponse.json({
      success: true,
      period,
      reports: {
        revenue: {
          total: totalRevenue,
          by_plan: Object.values(revenueByPlan),
          payments_count: payments?.length || 0,
        },
        subscriptions: {
          total: subscriptions?.length || 0,
          active: activeSubscriptions,
          cancelled: cancelledSubscriptions,
          by_plan: Object.values(subscriptionsByPlan),
        },
        pending: {
          total_amount: totalPending,
          count: pendingPayments?.length || 0,
          payments: (pendingPayments || []).slice(0, 20).map((p: any) => ({
            id: p.id,
            user_name: p.user?.name || 'Usuário',
            user_email: p.user?.email || '',
            plan_name: p.plan?.name || '',
            amount_cents: p.amount_cents,
            created_at: p.created_at,
          })),
        },
        renewals: {
          upcoming_30_days: (upcomingRenewals || []).map((r: any) => ({
            id: r.id,
            user_name: r.user?.name || 'Usuário',
            user_email: r.user?.email || '',
            plan_name: r.plan?.name || '',
            renewal_date: r.current_period_end,
            amount_cents: r.plan?.price_monthly_cents || 0,
          })),
        },
        users_without_payment: {
          count: usersWithoutPayment.length,
          users: usersWithoutPayment.slice(0, 20).map((s: any) => ({
            user_id: s.user_id,
            user_name: s.user?.name || 'Usuário',
            user_email: s.user?.email || '',
            plan_name: s.plan?.name || '',
            started_at: s.started_at,
          })),
        },
      },
    })
  } catch (error: any) {
    console.error('Erro em GET /api/admin/financial/reports:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar relatórios" },
      { status: 500 }
    )
  }
}


