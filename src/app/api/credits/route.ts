import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { 
  getUserCreditBalance, 
  getCreditPackages,
  loadCredits,
  getUserCreditTransactions,
  getUserCreditStats,
  type CreditBalance
} from "@/lib/db/credits"

/**
 * GET /api/credits
 * Obter saldo e informações de créditos do usuário atual
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Try to get user from cookies first
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
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

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Usar adminClient para evitar problemas de RLS
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    
    // Buscar saldo usando adminClient (bypass RLS)
    const { data: balanceData, error: balanceError } = await adminClient
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let balance: CreditBalance | null = null
    
    if (balanceError) {
      // Se não existe, criar registro usando adminClient
      if (balanceError.code === 'PGRST116') {
        const { data: newRecord, error: insertError } = await (adminClient
          .from('user_credits') as any)
          .insert({
            user_id: user.id,
            balance: 0,
            total_loaded: 0,
            total_consumed: 0,
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('❌ [API /api/credits GET] Erro ao criar registro:', insertError)
        } else if (newRecord) {
          balance = newRecord as CreditBalance
        }
      } else {
        console.error('❌ [API /api/credits GET] Erro ao buscar saldo:', balanceError)
      }
    } else if (balanceData) {
      balance = balanceData as CreditBalance
    }

    const packages = await getCreditPackages()

    // Se não há balance ou os valores estão zerados, calcular a partir de atividades
    if (!balance || (balance.total_loaded === 0 && balance.total_consumed === 0)) {
      const stats = await getUserCreditStats(user.id)
      
      // Se encontrou dados nas atividades, usar esses valores
      if (stats.total_loaded > 0 || stats.total_consumed > 0) {
        const calculatedBalance: CreditBalance = {
          balance: stats.balance,
          total_loaded: stats.total_loaded,
          total_consumed: stats.total_consumed,
          is_blocked: balance?.is_blocked || false,
          low_balance_threshold: balance?.low_balance_threshold || 10
        }
        
        return NextResponse.json({
          success: true,
          balance: calculatedBalance,
          packages
        })
      }
    }

    if (!balance) {
      return NextResponse.json({
        success: true,
        balance: {
          balance: 0,
          total_loaded: 0,
          total_consumed: 0,
          is_blocked: false,
          low_balance_threshold: 10
        },
        packages
      })
    }

    return NextResponse.json({
      success: true,
      balance,
      packages
    })
  } catch (error: any) {
    console.error('Error in GET /api/credits:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao obter créditos" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/credits
 * Carregar créditos (comprar pacote)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Try to get user from cookies first
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
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

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { package_id, payment_id, custom_credits, custom_price_cents } = body

    if (!package_id && !custom_credits) {
      return NextResponse.json(
        { error: "package_id ou custom_credits é obrigatório" },
        { status: 400 }
      )
    }

    // TODO: Aqui você integraria com gateway de pagamento (Stripe, PayPal, etc.)
    // Por enquanto, vamos simular que o pagamento foi aprovado
    // Em produção, você deve:
    // 1. Criar intenção de pagamento no gateway
    // 2. Aguardar confirmação
    // 3. Só então carregar os créditos

    // Se for compra customizada, usar package_id do primeiro pacote como base para cálculo
    // mas passar os valores customizados
    let finalPackageId = package_id
    let finalCredits = custom_credits
    let finalPrice = custom_price_cents

    if (custom_credits && custom_price_cents) {
      // Buscar o primeiro pacote para usar como referência
      const packages = await getCreditPackages()
      if (packages.length > 0) {
        finalPackageId = packages[0].id
      }
    }

    const result = await loadCredits(
      user.id, 
      finalPackageId, 
      payment_id,
      finalCredits ? { credits: finalCredits, price_cents: finalPrice } : undefined
    )

    if (!result.success) {
      console.error('❌ [API /api/credits POST] Erro ao carregar créditos:', result.error)
      return NextResponse.json(
        { error: result.error || "Erro ao carregar créditos" },
        { status: 400 }
      )
    }

    // Aguardar um pouco para garantir que a transação foi commitada
    await new Promise(resolve => setTimeout(resolve, 500))

    // Obter saldo atualizado usando adminClient para garantir que vemos os dados
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    
    const { data: balanceData, error: balanceError } = await adminClient
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (balanceError) {
      console.error('⚠️ [API /api/credits POST] Erro ao obter saldo com adminClient:', balanceError)
      // Tentar com getUserCreditBalance como fallback
      const balance = await getUserCreditBalance(user.id)
      return NextResponse.json({
        success: true,
        transaction_id: result.transactionId,
        balance: balance || {
          balance: 0,
          total_loaded: 0,
          total_consumed: 0,
          is_blocked: false,
          low_balance_threshold: 10
        }
      })
    }

    const balanceDataTyped = balanceData as {
      balance?: number;
      total_loaded?: number;
      total_consumed?: number;
      is_blocked?: boolean;
      low_balance_threshold?: number;
    } | null

    const balance = {
      balance: balanceDataTyped?.balance || 0,
      total_loaded: balanceDataTyped?.total_loaded || 0,
      total_consumed: balanceDataTyped?.total_consumed || 0,
      is_blocked: balanceDataTyped?.is_blocked || false,
      low_balance_threshold: balanceDataTyped?.low_balance_threshold || 10
    }

    return NextResponse.json({
      success: true,
      transaction_id: result.transactionId,
      balance
    })
  } catch (error: any) {
    console.error('Error in POST /api/credits:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao carregar créditos" },
      { status: 500 }
    )
  }
}

