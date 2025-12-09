import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar todo o progresso do usuário
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar via cookies, tentar via header Authorization
    if (authError || !user) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseModule = await import('@supabase/supabase-js')
        const createSupabaseClient = supabaseModule.createClient
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        const { data: { user: tokenUser } } = await tempClient.auth.getUser(token)
        if (tokenUser) {
          user = tokenUser
          authError = null
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const cursoId = searchParams.get('curso_id')
    const moduloId = searchParams.get('modulo_id')

    // Buscar progresso do usuário
    let query = supabase
      .from('user_aula_progress')
      .select(`
        *,
        aulas!inner (
          id,
          titulo,
          modulo_id,
          ordem
        )
      `)
      .eq('user_id', user.id)

    const { data: progress, error } = await query

    // Se houver filtros, aplicar após buscar os dados
    let filteredProgress = progress || []
    
    if (moduloId) {
      filteredProgress = filteredProgress.filter((p: any) => p.aulas?.modulo_id === moduloId)
    }
    
    if (cursoId && filteredProgress.length > 0) {
      // Buscar módulos para filtrar por curso
      const { data: modulos } = await supabase
        .from('modulos')
        .select('id, curso_id')
        .eq('curso_id', cursoId)
      
      const moduloIds = modulos?.map(m => m.id) || []
      filteredProgress = filteredProgress.filter((p: any) => 
        moduloIds.includes(p.aulas?.modulo_id)
      )
    }

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar progresso", details: error.message },
        { status: 500 }
      )
    }

    // Calcular estatísticas
    const totalAulas = filteredProgress?.length || 0
    const aulasConcluidas = filteredProgress?.filter((p: any) => p.concluida).length || 0
    const progressoGeral = totalAulas > 0 ? (aulasConcluidas / totalAulas) * 100 : 0

    return NextResponse.json({
      success: true,
      progress: filteredProgress || [],
      stats: {
        total_aulas: totalAulas,
        aulas_concluidas: aulasConcluidas,
        progresso_geral: progressoGeral
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

