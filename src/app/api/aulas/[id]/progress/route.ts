import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Aula } from "@/types/cursos"

// GET - Buscar progresso do usuário na aula
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: progress, error } = await supabase
      .from('user_aula_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('aula_id', params.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: "Erro ao buscar progresso", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      progress: progress || {
        concluida: false,
        progresso_percentual: 0,
        tempo_assistido_segundos: 0
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// POST/PATCH - Atualizar progresso do usuário na aula
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { concluida, progresso_percentual, tempo_assistido_segundos } = body

    // Verificar se a aula existe e está ativa
    const { data: aula, error: aulaError } = await supabase
      .from('aulas')
      .select('id, modulo_id, ordem')
      .eq('id', params.id)
      .eq('is_active', true)
      .single()

    if (aulaError || !aula) {
      return NextResponse.json(
        { error: "Aula não encontrada ou inativa" },
        { status: 404 }
      )
    }

    const aulaData = aula as Pick<Aula, 'id' | 'modulo_id' | 'ordem'>

    // Verificar se a aula anterior foi concluída (se não for a primeira)
    if (aulaData.ordem > 1) {
      const { data: aulaAnterior } = await supabase
        .from('aulas')
        .select('id')
        .eq('modulo_id', aulaData.modulo_id)
        .eq('ordem', aulaData.ordem - 1)
        .single()

      if (aulaAnterior) {
        const aulaAnteriorData = aulaAnterior as { id: string }
        const { data: progressoAnterior } = await supabase
          .from('user_aula_progress')
          .select('concluida')
          .eq('user_id', user.id)
          .eq('aula_id', aulaAnteriorData.id)
          .single()

        const progressoAnteriorData = progressoAnterior as { concluida: boolean } | null
        if (!progressoAnteriorData?.concluida) {
          return NextResponse.json(
            { error: "Complete a aula anterior primeiro" },
            { status: 403 }
          )
        }
      }
    }

    // Upsert progresso
    const progressData: any = {
      user_id: user.id,
      aula_id: params.id,
      progresso_percentual: progresso_percentual || 0,
      tempo_assistido_segundos: tempo_assistido_segundos || 0
    }

    if (concluida !== undefined) {
      progressData.concluida = concluida
      if (concluida) {
        progressData.progresso_percentual = 100
      }
    }

    const { data: progress, error: progressError } = await supabase
      .from('user_aula_progress')
      .upsert(progressData, {
        onConflict: 'user_id,aula_id'
      })
      .select()
      .single()

    if (progressError) {
      return NextResponse.json(
        { error: "Erro ao salvar progresso", details: progressError.message },
        { status: 500 }
      )
    }

    // Se a aula foi concluída, verificar se há próxima aula e liberá-la
    if (concluida) {
      const { data: proximaAula } = await supabase
        .from('aulas')
        .select('id')
        .eq('modulo_id', aulaData.modulo_id)
        .eq('ordem', aulaData.ordem + 1)
        .eq('is_active', true)
        .single()

      // A próxima aula já estará disponível automaticamente pela verificação de ordem
      // Não precisamos criar um registro de progresso para ela ainda
    }

    return NextResponse.json({
      success: true,
      progress,
      message: concluida ? "Aula concluída com sucesso! Próxima aula liberada." : "Progresso salvo"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

