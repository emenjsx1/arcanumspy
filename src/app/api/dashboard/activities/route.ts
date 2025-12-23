import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRecentActivities } from "@/lib/db/dashboard-server"

/**
 * GET /api/dashboard/activities
 * Obter atividades recentes do usuário
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Buscar atividades recentes com timeout reduzido
    try {
      const activities = await Promise.race([
        getRecentActivities(limit),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar atividades')), 5000)
        )
      ]) as any

      return NextResponse.json({
        success: true,
        activities
      })
    } catch (activitiesError: any) {
      // Se houver timeout ou erro de conexão, retornar array vazio
      console.warn('⚠️ [Dashboard Activities] Erro ao buscar atividades, retornando array vazio:', activitiesError.message)
      return NextResponse.json({
        success: true,
        activities: []
      })
    }
  } catch (error: any) {
    console.error('❌ [Dashboard Activities] Erro geral:', error)
    
    // Se for timeout de conexão, retornar array vazio em vez de erro
    if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message?.includes('timeout')) {
      return NextResponse.json({
        success: true,
        activities: []
      })
    }
    
    return NextResponse.json(
      { error: error.message || "Erro ao obter atividades" },
      { status: 500 }
    )
  }
}

