import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminGetPayments, createPayment } from "@/lib/db/payments"

export async function GET(request: Request) {
  try {
    let user = null
    let isAdmin = false

    // Tentar autenticação via cookie primeiro
    const supabase = await createClient()
    const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()

    if (!authError && cookieUser) {
      user = cookieUser
    } else {
      // Tentar autenticação via header Authorization
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseModule = await import('@supabase/supabase-js')
        const createSupabaseClient = supabaseModule.createClient
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        const { data: { user: tokenUser } } = await tempClient.auth.getUser(token)
        if (tokenUser) {
          user = tokenUser
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Verificar se é admin usando adminClient para bypass RLS
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    isAdmin = (profile as unknown as { role?: string })?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'paid' | 'pending' | 'failed' | 'refunded' | null
    const plan_id = searchParams.get('plan_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    const filters: any = {}
    if (status) filters.status = status
    if (plan_id) filters.plan_id = plan_id
    if (start_date) filters.start_date = start_date
    if (end_date) filters.end_date = end_date

    const payments = await adminGetPayments(filters)

    // Enriquecer pagamentos com dados de usuário e plano
    const enrichedPayments = payments.map((payment: any) => ({
      ...payment,
      user_name: payment.user?.name || null,
      user_email: payment.user?.email || null,
      plan_name: payment.plan?.name || null,
    }))

    return NextResponse.json({ payments: enrichedPayments })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar pagamentos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { user_id, plan_id, amount_cents, currency, status, provider, external_id, paid_at, period_start, period_end, payment_method, method, transaction_id } = body

    if (!user_id || !plan_id || !amount_cents) {
      return NextResponse.json(
        { error: "Campos obrigatórios: user_id, plan_id, amount_cents" },
        { status: 400 }
      )
    }

    const payment = await createPayment({
      user_id,
      plan_id,
      amount_cents,
      currency: currency || 'MZN',
      status: status || 'pending',
      // Usar provider para armazenar método de pagamento se payment_method ou method foram fornecidos
      provider: provider || payment_method || method || null,
      external_id: external_id || null,
      paid_at: paid_at || null,
      period_start: period_start || null,
      period_end: period_end || null,
      transaction_id: transaction_id || null,
    } as any)

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar pagamento" },
      { status: 500 }
    )
  }
}

