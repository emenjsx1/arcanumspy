import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTicketWithReplies } from "@/lib/db/tickets"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const ticket = await getTicketWithReplies(params.id, user.id)

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticket })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ticket" },
      { status: 500 }
    )
  }
}

