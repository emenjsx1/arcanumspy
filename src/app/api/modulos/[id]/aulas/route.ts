import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { CreateAulaInput } from "@/types/cursos"

async function checkAdmin(request: NextRequest) {
  let isAdmin = false
  let user = null
  
  try {
    const supabase = await createClient()
    const { data: { user: userFromCookies }, error: authError } = await supabase.auth.getUser()

    if (!authError && userFromCookies) {
      user = userFromCookies
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userFromCookies.id)
        .single()

      isAdmin = profile?.role === 'admin'
    } else {
      // Se não conseguir autenticar via cookies, tentar via header
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
          const adminClient = createAdminClient()
          const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', tokenUser.id)
            .single()

          isAdmin = profile?.role === 'admin'
        }
      }
    }
  } catch (authError) {
    console.error('⚠️ [Aulas API] Erro ao verificar autenticação:', authError)
  }
  
  return { isAdmin, user }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Tentar obter usuário via cookies primeiro
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar, tentar ler do header Authorization
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
    const includeInactive = searchParams.get('include_inactive') === 'true'
    
    const { isAdmin } = await checkAdmin(request)
    
    // Verificar se o módulo existe e está ativo (se não for admin)
    const moduloQuery = supabase
      .from('modulos')
      .select('id, is_active, curso_id')
      .eq('id', params.id)
      .single()
    
    if (!isAdmin) {
      moduloQuery.eq('is_active', true)
    }
    
    const { data: modulo, error: moduloError } = await moduloQuery
    
    if (moduloError || !modulo) {
      return NextResponse.json(
        { error: "Módulo não encontrado" },
        { status: 404 }
      )
    }
    
    // Se não for admin, verificar se o curso também está ativo
    if (!isAdmin) {
      const { data: curso } = await supabase
        .from('cursos')
        .select('id, is_active')
        .eq('id', modulo.curso_id)
        .eq('is_active', true)
        .single()
      
      if (!curso) {
        return NextResponse.json(
          { error: "Curso não encontrado ou inativo" },
          { status: 404 }
        )
      }
    }
    
    let query = supabase
      .from('aulas')
      .select('*')
      .eq('modulo_id', params.id)
      .order('ordem', { ascending: true })
    
    if (!isAdmin || !includeInactive) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar aulas", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      aulas: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isAdmin, user } = await checkAdmin(request)
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem criar aulas." },
        { status: 403 }
      )
    }

    const body: CreateAulaInput = await request.json()
    
    if (!body.titulo) {
      return NextResponse.json(
        { error: "Título da aula é obrigatório" },
        { status: 400 }
      )
    }
    
    if (!body.video_url) {
      return NextResponse.json(
        { error: "URL do vídeo é obrigatória" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    
    // Verificar se o módulo existe
    const { data: modulo, error: moduloError } = await adminClient
      .from('modulos')
      .select('id')
      .eq('id', params.id)
      .single()
    
    if (moduloError || !modulo) {
      return NextResponse.json(
        { error: "Módulo não encontrado" },
        { status: 404 }
      )
    }

    const { data, error } = await adminClient
      .from('aulas')
      .insert({
        modulo_id: params.id,
        titulo: body.titulo,
        descricao: body.descricao || null,
        video_url: body.video_url,
        duracao_minutos: body.duracao_minutos || null,
        ordem: body.ordem ?? 0,
        is_active: body.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [Aulas API] Erro ao inserir aula:', error)
      return NextResponse.json(
        { error: "Erro ao criar aula", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      aula: data
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ [Aulas API] Erro geral:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

