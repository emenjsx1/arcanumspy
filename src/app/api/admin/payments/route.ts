import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminGetPayments, createPayment } from "@/lib/db/payments"

export async function GET(request: Request) {
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

    return NextResponse.json({ payments })
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
    const { user_id, plan_id, amount_cents, currency, status, provider, external_id, paid_at, period_start, period_end } = body

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
      provider: provider || null,
      external_id: external_id || null,
      paid_at: paid_at || null,
      period_start: period_start || null,
      period_end: period_end || null,
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar pagamento" },
      { status: 500 }
    )
  }
}

