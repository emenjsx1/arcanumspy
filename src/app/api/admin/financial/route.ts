import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    let isAdmin = false
    
    try {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (!authError && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        isAdmin = (profile as unknown as { role?: string })?.role === 'admin'
      } else {
        const authHeader = request.headers.get('authorization')
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
            const adminClient = createAdminClient()
            const { data: profile } = await adminClient
              .from('profiles')
              .select('role')
              .eq('id', tokenUser.id)
              .single()

            isAdmin = (profile as unknown as { role?: string })?.role === 'admin'
          }
        }
      }
    } catch (authError) {
      console.warn('⚠️ [Admin Financial] Erro ao verificar autenticação, continuando com Service Role Key:', authError)
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Não autorizado", details: "Apenas administradores podem acessar" },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()

    // Calcular datas
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Buscar receita real da tabela payments (apenas pagamentos confirmados)
    // Incluir tanto 'paid' quanto 'completed' na receita total
    const { data: allPayments } = await adminClient
      .from('payments')
      .select('amount_cents, paid_at, created_at, status')
      .in('status', ['paid', 'completed'])

    // Receita total (todos os pagamentos confirmados)
    const totalRevenue = (allPayments || []).reduce((sum: number, p: any) => {
      return sum + (p.amount_cents || 0)
    }, 0)

    // Receita mensal (pagamentos confirmados deste mês)
    const monthlyPayments = (allPayments || []).filter((p: any) => {
      const paymentDate = new Date(p.paid_at || p.created_at)
      return paymentDate >= startOfMonth
    })

    const monthlyRevenue = monthlyPayments.reduce((sum: number, p: any) => {
      return sum + (p.amount_cents || 0)
    }, 0)

    // Buscar assinaturas para estatísticas
    const { data: subscriptions } = await adminClient
      .from('subscriptions')
      .select(`
        *,
        profile:profiles(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    const monthlySubscriptions = (subscriptions || []).filter((s: any) => {
      const subDate = new Date(s.created_at)
      return subDate >= startOfMonth
    })

    // Estatísticas de ferramentas (removido: voice cloning desabilitado)
    const totalVoices = { count: 0 }

    // Gerações de áudio
    let totalAudioGenerations = 0
    try {
      const result = await adminClient
        .from('voice_audio_generations')
        .select('*', { count: 'exact', head: true })
      totalAudioGenerations = result.count || 0
    } catch {
      totalAudioGenerations = 0
    }

    // Visualizações de ofertas
    let totalOfferViews = 0
    try {
      const result = await adminClient
        .from('offer_views')
        .select('*', { count: 'exact', head: true })
      totalOfferViews = result.count || 0
    } catch {
      totalOfferViews = 0
    }

    const stats = {
      totalRevenue,
      monthlyRevenue,
      totalSubscriptions: subscriptions?.length || 0,
      monthlySubscriptions: monthlySubscriptions.length,
    }

    const toolStats = {
      voiceGeneration: {
        totalVoices: 0, // Removido: voice cloning desabilitado
      },
      audioGeneration: {
        totalGenerations: totalAudioGenerations || 0,
      },
      offerViews: {
        totalViews: totalOfferViews || 0,
      },
    }

    return NextResponse.json({
      success: true,
      stats,
      subscriptions: (subscriptions || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        user_name: s.profile?.name,
        user_email: s.profile?.email,
        plan_name: s.plan_name,
        amount_cents: s.amount_cents,
        created_at: s.created_at,
      })),
      toolStats,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/financial:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao obter dados financeiros" },
      { status: 500 }
    )
  }
}
