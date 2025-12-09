import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { joinCommunity } from "@/lib/db/communities"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Tentar autenticar via cookies primeiro
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar, tentar via header Authorization
    if (!user && authError) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
        user = userFromToken
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const result = await joinCommunity(user.id, params.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao entrar na comunidade" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao entrar na comunidade" },
      { status: 500 }
    )
  }
}

