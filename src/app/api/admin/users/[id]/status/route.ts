import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-helpers/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const { user } = authResult

    const body = await request.json()
    const { banned } = body

    if (typeof banned !== 'boolean') {
      return NextResponse.json(
        { error: "Campo 'banned' deve ser um booleano" },
        { status: 400 }
      )
    }

    const userId = params.id

    // Não permitir que um admin bloqueie a si mesmo
    if (userId === user.id && banned) {
      return NextResponse.json(
        { error: "Você não pode bloquear a si mesmo" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    
    // Atualizar o status banned
    const { data: updatedProfile, error: updateError } = await (adminClient
      .from('profiles') as any)
      .update({ banned })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar status do usuário:', updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar status do usuário", details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Status do usuário atualizado: ${banned ? 'Bloqueado' : 'Desbloqueado'}`,
      profile: updatedProfile
    })

  } catch (error: any) {
    console.error('Erro ao atualizar status do usuário:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar status do usuário" },
      { status: 500 }
    )
  }
}

