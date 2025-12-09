import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { CreateCursoInput } from "@/types/cursos"

async function checkAdmin(request: NextRequest) {
  let isAdmin = false
  let user = null
  
  try {
    const supabase = await createClient()
    const { data: { user: userFromCookies }, error: authError } = await supabase.auth.getUser()

    if (!authError && userFromCookies) {
      user = userFromCookies
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userFromCookies.id)
        .single()

      if (profileError) {
        console.error('⚠️ [Cursos API] Erro ao buscar perfil:', profileError)
      }

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
          // Usar adminClient para verificar perfil (bypassa RLS)
          const adminClient = createAdminClient()
          const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', tokenUser.id)
            .single()

          if (profileError) {
            console.error('⚠️ [Cursos API] Erro ao buscar perfil via admin client:', profileError)
          }

          isAdmin = profile?.role === 'admin'
        }
      } else {
        console.warn('⚠️ [Cursos API] Nenhum token de autenticação encontrado')
      }
    }
  } catch (authError) {
    console.error('⚠️ [Cursos API] Erro ao verificar autenticação:', authError)
  }
  
  return { isAdmin, user }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { isAdmin, user } = await checkAdmin(request)
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'
    
    let query = supabase
      .from('cursos')
      .select('*')
      .order('ordem', { ascending: true })
    
    if (!isAdmin || !includeInactive) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar cursos", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cursos: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
        { error: "Acesso negado. Apenas administradores podem criar cursos." },
        { status: 403 }
      )
    }

    const body: CreateCursoInput = await request.json()
    
    if (!body.nome) {
      return NextResponse.json(
        { error: "Nome do curso é obrigatório" },
        { status: 400 }
      )
    }

    // Usar adminClient para bypassar RLS e garantir que a inserção funcione
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from('cursos')
      .insert({
        nome: body.nome,
        descricao: body.descricao || null,
        imagem_url: body.imagem_url || null,
        ordem: body.ordem ?? 0,
        is_active: body.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [Cursos API] Erro ao inserir curso:', error)
      return NextResponse.json(
        { error: "Erro ao criar curso", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      curso: data
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ [Cursos API] Erro geral:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

