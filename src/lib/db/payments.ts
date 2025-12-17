import { Database } from '@/types/database'

type Payment = Database['public']['Tables']['payments']['Row']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export interface PaymentWithUser extends Payment {
  user?: {
    id: string
    name: string
    phone_number: string | null
    email?: string
  }
  plan?: {
    id: string
    name: string
    slug: string
  }
}

export interface PaymentFilters {
  status?: Payment['status']
  plan_id?: string
  start_date?: string
  end_date?: string
}

export interface FinancialOverview {
  total_revenue_today: number
  total_revenue_this_month: number
  payments_pending_count: number
  total_active_subscriptions: number
  most_paid_plan: {
    name: string
    count: number
  } | null
}

/**
 * Admin: Get financial overview
 */
export async function adminGetFinancialOverview(): Promise<FinancialOverview> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Revenue today
    const { data: todayPayments } = await (adminClient
      .from('payments') as any)
      .select('amount_cents')
      .eq('status', 'paid')
      .gte('paid_at', today.toISOString())

    const total_revenue_today = (todayPayments || []).reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)

    // Revenue this month
    const { data: monthPayments } = await (adminClient
      .from('payments') as any)
      .select('amount_cents')
      .eq('status', 'paid')
      .gte('paid_at', monthStart.toISOString())

    const total_revenue_this_month = (monthPayments || []).reduce((sum: number, p: any): number => sum + (p.amount_cents || 0), 0)

    // Pending payments count
    const { count: payments_pending_count } = await (adminClient
      .from('payments') as any)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Active subscriptions count
    const { count: total_active_subscriptions } = await adminClient
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Most paid plan
    const { data: planStats } = await (adminClient
      .from('payments') as any)
      .select('plan_id, plans(name)')
      .eq('status', 'paid')

    const planCounts: Record<string, { name: string; count: number }> = {}
    planStats?.forEach((p: any) => {
      const planId = p.plan_id
      const planName = p.plans?.name || 'Unknown'
      if (!planCounts[planId]) {
        planCounts[planId] = { name: planName, count: 0 }
      }
      planCounts[planId].count++
    })

    const most_paid_plan = Object.values(planCounts).reduce((max: { name: string; count: number } | null, plan: { name: string; count: number }) => {
      return plan.count > (max?.count || 0) ? plan : max
    }, null as { name: string; count: number } | null)

    return {
      total_revenue_today,
      total_revenue_this_month,
      payments_pending_count: payments_pending_count || 0,
      total_active_subscriptions: total_active_subscriptions || 0,
      most_paid_plan,
    }
  } catch (error) {
    console.error('Error fetching financial overview:', error)
    return {
      total_revenue_today: 0,
      total_revenue_this_month: 0,
      payments_pending_count: 0,
      total_active_subscriptions: 0,
      most_paid_plan: null,
    }
  }
}

/**
 * Admin: Get payments with filters
 */
export async function adminGetPayments(filters?: PaymentFilters): Promise<PaymentWithUser[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // Buscar pagamentos primeiro (sem join com profiles)
    let query = adminClient
      .from('payments')
      .select('*, plan:plans(id, name, slug)')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.plan_id) {
      query = query.eq('plan_id', filters.plan_id)
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    const { data: payments, error: paymentsError } = await query

    if (paymentsError) throw paymentsError

    if (!payments || payments.length === 0) {
      return []
    }

    // Buscar perfis separadamente usando os user_ids
    const userIds = [...new Set(payments.map((p: any) => p.user_id))]
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds)

    // Se houver erro ao buscar perfis, continuar sem eles
    if (profilesError) {
      console.warn('⚠️ [adminGetPayments] Erro ao buscar perfis:', profilesError.message)
    }

    // Criar mapa de perfis por user_id
    const profileMap = new Map()
    if (profiles) {
      profiles.forEach((profile: any) => {
        profileMap.set(profile.id, profile)
      })
    }

    // Combinar pagamentos com perfis
    return payments.map((payment: any) => ({
      ...payment,
      user: profileMap.get(payment.user_id) || null,
      plan: payment.plan || null,
    })) as PaymentWithUser[]
  } catch (error) {
    console.error('Error fetching payments:', error)
    return []
  }
}

/**
 * Admin: Get users with pending payments
 */
export async function adminGetUsersWithPendingPayments(): Promise<PaymentWithUser[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data, error } = await (adminClient
      .from('payments') as any)
      .select(`
        *,
        user:profiles(id, name, email),
        plan:plans(id, name, slug)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((payment: any) => ({
      ...payment,
      user: payment.user,
      plan: payment.plan,
    })) as PaymentWithUser[]
  } catch (error) {
    console.error('Error fetching pending payments:', error)
    return []
  }
}

/**
 * Create payment
 */
export async function createPayment(payment: PaymentInsert): Promise<Payment | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data, error } = await (adminClient
      .from('payments') as any)
      .insert(payment)
      .select()
      .single()

    if (error) throw error

    return data as Payment
  } catch (error) {
    console.error('Error creating payment:', error)
    throw error
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(paymentId: string, status: Payment['status'], paidAt?: string): Promise<Payment | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const updateData: Partial<Payment> = { status }
    if (paidAt) {
      updateData.paid_at = paidAt
    }

    // Buscar dados do pagamento antes de atualizar (para enviar email se necessário)
    const { data: paymentBefore } = await (adminClient
      .from('payments') as any)
      .select(`
        *,
        user:profiles(id, name, email),
        plan:plans(id, name, slug)
      `)
      .eq('id', paymentId)
      .single()

    const { data, error } = await (adminClient
      .from('payments') as any)
      .update(updateData)
      .eq('id', paymentId)
      .select(`
        *,
        user:profiles(id, name, email),
        plan:plans(id, name, slug)
      `)
      .single()

    if (error) throw error

    // Se o status mudou para 'paid' e antes não estava 'paid', enviar email
    if (status === 'paid' && paymentBefore?.status !== 'paid') {
      const payment = data as any
      const userEmail = payment.user?.email || paymentBefore?.user?.email
      const userName = payment.user?.name || paymentBefore?.user?.name || 'Cliente'
      const planName = payment.plan?.name || paymentBefore?.plan?.name || 'Plano'
      
      if (userEmail) {
        // Enviar email de confirmação de pagamento (não bloqueia se falhar)
        try {
          const { sendPaymentSuccessEmail } = await import('@/lib/email')
          await sendPaymentSuccessEmail({
            name: userName,
            userEmail: userEmail, // email do destinatário
            amount: (payment.amount_cents || 0) / 100,
            currency: payment.currency || 'BRL',
            planName,
            invoiceNumber: payment.invoice_number,
            invoiceUrl: payment.invoice_url,
            paymentDate: payment.paid_at || new Date().toISOString(),
          })
        } catch (emailError) {
          console.warn('⚠️ Erro ao enviar email de pagamento (não crítico):', emailError)
        }
      }
    }

    return data as Payment
  } catch (error) {
    console.error('Error updating payment status:', error)
    throw error
  }
}

