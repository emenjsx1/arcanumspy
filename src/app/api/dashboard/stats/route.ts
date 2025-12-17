import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDashboardStats } from "@/lib/db/dashboard-server"
import { withMediumCache } from "@/lib/api-cache"

/**
 * GET /api/dashboard/stats
 * Obter estatísticas do dashboard do usuário
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

    // Buscar estatísticas do dashboard com timeout
    try {
      const stats = await Promise.race([
        getDashboardStats(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar estatísticas')), 15000)
        )
      ]) as any

      // Garantir que stats tem o formato esperado pelo frontend
      const formattedStats = {
        offersViewed: stats.offersViewed || stats.offers_viewed || 0,
        offersViewedTotal: stats.offersViewedTotal || stats.offers_viewed_total || 0,
        favoritesCount: stats.favoritesCount || stats.favorites_count || 0,
        categoriesAccessed: stats.categoriesAccessed || stats.categories_accessed || 0,
      }

      const response = NextResponse.json({
        success: true,
        stats: formattedStats
      })
      return withMediumCache(response) // Cache de 1 minuto (dados específicos do usuário)
    } catch (statsError: any) {
      // Se houver timeout ou erro de conexão, retornar dados vazios
      console.warn('⚠️ [Dashboard Stats] Erro ao buscar stats, retornando dados vazios:', statsError.message)
      const response = NextResponse.json({
        success: true,
        stats: {
          offersViewed: 0,
          offersViewedTotal: 0,
          favoritesCount: 0,
          categoriesAccessed: 0
        }
      })
      return withMediumCache(response)
    }
  } catch (error: any) {
    console.error('❌ [Dashboard Stats] Erro geral:', error)
    
    // Se for timeout de conexão, retornar dados vazios em vez de erro
    if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message?.includes('timeout')) {
      const response = NextResponse.json({
        success: true,
        stats: {
          offersViewed: 0,
          offersViewedTotal: 0,
          favoritesCount: 0,
          categoriesAccessed: 0
        }
      })
      return withMediumCache(response)
    }
    
    return NextResponse.json(
      { error: error.message || "Erro ao obter estatísticas" },
      { status: 500 }
    )
  }
}

