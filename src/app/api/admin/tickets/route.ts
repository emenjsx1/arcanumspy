import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminGetAllTickets } from "@/lib/db/tickets"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error in GET /api/admin/tickets:', authError)
      return NextResponse.json(
        { error: "Erro de autenticação: " + authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('No user in GET /api/admin/tickets')
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
    const status = searchParams.get('status') as 'open' | 'in_progress' | 'closed' | null
    const priority = searchParams.get('priority') as 'low' | 'medium' | 'high' | null

    const filters: any = {}
    if (status) filters.status = status
    if (priority) filters.priority = priority

    const tickets = await adminGetAllTickets(filters)

    return NextResponse.json({ tickets })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar tickets" },
      { status: 500 }
    )
  }
}

