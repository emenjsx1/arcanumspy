import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRecentSearches } from "@/lib/db/dashboard-server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    const searches = await getRecentSearches(limit)

    return NextResponse.json({
      success: true,
      searches
    })
  } catch (error: any) {
    console.error('Error in /api/dashboard/recent-searches:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar pesquisas recentes" },
      { status: 500 }
    )
  }
}



