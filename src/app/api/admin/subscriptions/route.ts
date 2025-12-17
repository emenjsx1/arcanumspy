/**
 * API Route: GET /api/admin/subscriptions
 * 
 * Retorna todas as assinaturas com informações de usuários, planos e pagamentos
 * Suporta filtros e busca
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedServer } from "@/lib/auth/isAuthenticated"

export interface SubscriptionWithDetails {
  id: string
  user_id: string
  user_name: string
  user_email: string
  plan_id: string
  plan_name: string
  plan_slug: string
  plan_price_cents: number
  is_free_plan: boolean
  status: string
  started_at: string
  current_period_end: string
  next_renewal: string
  cancelled_at: string | null
  created_at: string
  has_payment: boolean
  last_payment_date: string | null
  total_payments: number
  total_paid: number
}

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

    // Verificar se é admin (usar adminClient para bypass RLS)
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
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

    const { searchParams } = new URL(request.url)

    // Filtros
    const search = searchParams.get('search') || ''
    const planFilter = searchParams.get('plan') || ''
    const statusFilter = searchParams.get('status') || ''
    const paymentFilter = searchParams.get('payment') || '' // 'paid', 'unpaid', 'all'

    // Buscar todas as assinaturas com planos
    let subscriptionsQuery = adminClient
      .from('subscriptions')
      .select(`
        *,
        plan:plans(
          id,
          name,
          slug,
          price_monthly_cents
        )
      `)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      subscriptionsQuery = subscriptionsQuery.eq('status', statusFilter)
    }

    if (planFilter) {
      subscriptionsQuery = subscriptionsQuery.eq('plan_id', planFilter)
    }

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery

    if (subscriptionsError) {
      console.error('Erro ao buscar assinaturas:', subscriptionsError)
      return NextResponse.json(
        { error: "Erro ao buscar assinaturas" },
        { status: 500 }
      )
    }

    // Buscar todos os usuários para obter emails
    const userIds = (subscriptions || []).map((s: any) => s.user_id)
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const emailMap = new Map<string, string>()
    authUsers?.users.forEach((u) => {
      if (u.email) {
        emailMap.set(u.id, u.email)
      }
    })

    // Buscar perfis dos usuários
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds)

    const profileMap = new Map<string, { id: string; name: string | null; email: string | null }>()
    if (profiles && Array.isArray(profiles)) {
      (profiles as Array<{ id: string; name: string | null; email: string | null }>).forEach((p) => {
        profileMap.set(p.id, p)
      })
    }

    // Buscar pagamentos para cada assinatura
    const { data: payments } = await adminClient
      .from('payments')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })

    // Agrupar pagamentos por usuário
    const paymentsByUser = new Map<string, any[]>()
    payments?.forEach((p: any) => {
      if (!paymentsByUser.has(p.user_id)) {
        paymentsByUser.set(p.user_id, [])
      }
      paymentsByUser.get(p.user_id)!.push(p)
    })

    // Processar assinaturas com detalhes
    const subscriptionsWithDetails: SubscriptionWithDetails[] = (subscriptions || [])
      .map((sub: any) => {
        const profile = profileMap.get(sub.user_id)
        const email = emailMap.get(sub.user_id) || profile?.email || ''
        const userPayments = paymentsByUser.get(sub.user_id) || []
        const paidPayments = userPayments.filter((p: any) => p.status === 'paid' || p.status === 'completed')
        const lastPayment = paidPayments[0] || null

        const plan = sub.plan || {}
        const isFreePlan = !plan.price_monthly_cents || plan.price_monthly_cents === 0

        // Calcular próxima renovação
        const periodEnd = new Date(sub.current_period_end)
        const now = new Date()
        const nextRenewal = periodEnd > now ? periodEnd.toISOString() : null

        return {
          id: sub.id,
          user_id: sub.user_id,
          user_name: profile?.name || 'Usuário',
          user_email: email,
          plan_id: sub.plan_id,
          plan_name: plan.name || 'Plano Desconhecido',
          plan_slug: plan.slug || '',
          plan_price_cents: plan.price_monthly_cents || 0,
          is_free_plan: isFreePlan,
          status: sub.status,
          started_at: sub.started_at,
          current_period_end: sub.current_period_end,
          next_renewal: nextRenewal || '',
          cancelled_at: sub.cancelled_at,
          created_at: sub.created_at,
          has_payment: paidPayments.length > 0,
          last_payment_date: lastPayment?.paid_at || lastPayment?.created_at || null,
          total_payments: paidPayments.length,
          total_paid: paidPayments.reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0),
        }
      })
      .filter((sub: SubscriptionWithDetails) => {
        // Filtro de busca
        if (search) {
          const searchLower = search.toLowerCase()
          return (
            sub.user_name.toLowerCase().includes(searchLower) ||
            sub.user_email.toLowerCase().includes(searchLower) ||
            sub.plan_name.toLowerCase().includes(searchLower)
          )
        }

        // Filtro de pagamento
        if (paymentFilter === 'paid' && !sub.has_payment) {
          return false
        }
        if (paymentFilter === 'unpaid' && sub.has_payment) {
          return false
        }

        return true
      })

    return NextResponse.json({
      success: true,
      subscriptions: subscriptionsWithDetails,
      total: subscriptionsWithDetails.length,
    })
  } catch (error: any) {
    console.error('Erro em GET /api/admin/subscriptions:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}


