import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserCreditStats, getUserActivities } from "@/lib/db/credits"

/**
 * GET /api/credits/stats
 * Obter estatísticas de créditos do usuário (carregados, consumidos, atividades)
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

    // Buscar estatísticas de créditos
    const stats = await getUserCreditStats(user.id)
    
    // Buscar atividades recentes
    const activities = await getUserActivities(user.id, 20, 0)

    return NextResponse.json({
      success: true,
      stats,
      activities
    })
  } catch (error: any) {
    console.error('Error in GET /api/credits/stats:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao obter estatísticas" },
      { status: 500 }
    )
  }
}



