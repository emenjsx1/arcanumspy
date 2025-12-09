import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { debitCredits, isUserBlocked } from "@/lib/db/credits"

/**
 * POST /api/credits/debit
 * Debitar créditos do usuário (uso interno)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // Se não conseguir obter usuário via cookies, tentar via Authorization header
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

    // Verificar se usuário está bloqueado
    const blocked = await isUserBlocked(user.id)
    if (blocked) {
      return NextResponse.json(
        { error: "Usuário bloqueado por dívida. Carregue créditos para continuar." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { amount, category, description, metadata } = body

    if (!amount || !category) {
      return NextResponse.json(
        { error: "amount e category são obrigatórios" },
        { status: 400 }
      )
    }

    const result = await debitCredits(
      user.id,
      amount,
      category,
      description,
      metadata,
      true // Permite saldo negativo (dívida)
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao debitar créditos" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction_id: result.transactionId,
      balance_after: result.balanceAfter,
      message: result.balanceAfter && result.balanceAfter < 0 
        ? "Saldo negativo detectado. Carregue créditos para continuar usando a plataforma."
        : undefined
    })
  } catch (error: any) {
    console.error('Error in POST /api/credits/debit:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao debitar créditos" },
      { status: 500 }
    )
  }
}

