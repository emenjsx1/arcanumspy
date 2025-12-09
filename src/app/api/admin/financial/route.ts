import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCreditStats } from "@/lib/db/credits"

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

    // Buscar estatísticas de créditos
    const creditStats = await getCreditStats()

    // Buscar compras de créditos (transações de crédito do tipo purchase)
    const { data: purchases } = await adminClient
      .from('credit_transactions')
      .select(`
        *,
        profile:profiles(name, email)
      `)
      .eq('type', 'credit')
      .eq('category', 'purchase')
      .order('created_at', { ascending: false })
      .limit(50)

    // Calcular receita
    const totalRevenue = ((purchases || []) as any[]).reduce((sum, p: any) => {
      // Assumir que cada crédito custa R$ 0,10 (ajustar conforme necessário)
      return sum + ((p.amount || 0) * 0.10)
    }, 0)

    const monthlyPurchases = (purchases || []).filter((p: any) => {
      const purchaseDate = new Date(p.created_at)
      return purchaseDate >= startOfMonth
    })

    const monthlyRevenue = monthlyPurchases.reduce((sum, p: any) => {
      return sum + (((p as any).amount || 0) * 0.10)
    }, 0)

    // Estatísticas de ferramentas (vozes criadas, gerações de áudio, etc)
    const { count: totalVoices } = await adminClient
      .from('voice_clones')
      .select('*', { count: 'exact', head: true })

    // Créditos gastos com criação de vozes (50 créditos por voz)
    let voiceActivities: { data: any[] | null } = { data: null }
    try {
      const result = await adminClient
        .from('user_activities')
        .select('credits_used')
        .eq('type', 'VOICE_CREATE')
      voiceActivities = result
    } catch {
      voiceActivities = { data: null }
    }

    const voiceCreationCredits = (voiceActivities?.data || []).reduce((sum, a) => sum + (a.credits_used || 0), 0)

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

    // Créditos gastos com geração de áudio
    let audioActivities: { data: any[] | null } = { data: null }
    try {
      const result = await adminClient
        .from('user_activities')
        .select('credits_used')
        .eq('type', 'AUDIO_GENERATION')
      audioActivities = result
    } catch {
      audioActivities = { data: null }
    }

    const audioGenerationCredits = (audioActivities?.data || []).reduce((sum, a) => sum + (a.credits_used || 0), 0)

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
      totalCreditsLoaded: creditStats.total_credits_loaded,
      totalCreditsConsumed: creditStats.total_credits_consumed,
      totalRevenue,
      monthlyRevenue,
      totalPurchases: purchases?.length || 0,
      monthlyPurchases: monthlyPurchases.length,
    }

    const toolStats = {
      voiceGeneration: {
        totalVoices: totalVoices || 0,
        totalCredits: voiceCreationCredits,
        averageCreditsPerGeneration: totalVoices ? voiceCreationCredits / totalVoices : 0,
      },
      audioGeneration: {
        totalGenerations: totalAudioGenerations || 0,
        totalCredits: audioGenerationCredits,
        averageCreditsPerGeneration: totalAudioGenerations ? audioGenerationCredits / totalAudioGenerations : 0,
      },
      offerViews: {
        totalViews: totalOfferViews || 0,
      },
    }

    return NextResponse.json({
      success: true,
      stats,
      purchases: (purchases || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        user_name: p.profile?.name,
        user_email: p.profile?.email,
        amount: (p as any).amount,
        created_at: p.created_at,
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
