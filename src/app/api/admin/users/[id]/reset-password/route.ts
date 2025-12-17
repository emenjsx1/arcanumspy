import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-helpers/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const userId = params.id
    const adminClient = createAdminClient()

    // Buscar dados do usuário
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)
    
    if (userError || !userData?.user?.email) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Gerar link de recuperação de senha
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email,
    })

    if (linkError) {
      console.error('Erro ao gerar link de reset:', linkError)
      return NextResponse.json(
        { error: "Erro ao gerar link de recuperação de senha", details: linkError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Link de recuperação de senha gerado com sucesso",
      resetLink: linkData.properties?.action_link || linkData.properties?.hashed_token || null,
      email: userData.user.email,
    })

  } catch (error: any) {
    console.error('Erro ao resetar senha:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao resetar senha" },
      { status: 500 }
    )
  }
}

