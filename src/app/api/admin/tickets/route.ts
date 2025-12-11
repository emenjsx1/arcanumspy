import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminGetAllTickets } from "@/lib/db/tickets"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se não conseguir via cookies, tentar via header
    if (authError || !user) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
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

    // Check if user is admin (usar adminClient para bypass RLS)
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
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

