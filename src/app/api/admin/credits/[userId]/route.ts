import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserTransactionsForAdmin, setUserBlocked } from "@/lib/db/credits"

/**
 * GET /api/admin/credits/[userId]
 * Obter detalhes de créditos de um usuário específico (apenas admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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
    if (!profile || profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const transactions = await getUserTransactionsForAdmin(params.userId, 100)

    return NextResponse.json({
      success: true,
      transactions
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/credits/[userId]:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao obter dados do usuário" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/credits/[userId]
 * Bloquear/desbloquear usuário por dívida (apenas admin)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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
    if (!profile || profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { is_blocked } = body

    if (typeof is_blocked !== 'boolean') {
      return NextResponse.json(
        { error: "is_blocked deve ser um boolean" },
        { status: 400 }
      )
    }

    const success = await setUserBlocked(params.userId, is_blocked)

    if (!success) {
      return NextResponse.json(
        { error: "Erro ao atualizar status de bloqueio" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: is_blocked ? "Usuário bloqueado" : "Usuário desbloqueado"
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/credits/[userId]:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}












