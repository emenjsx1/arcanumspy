import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { CreateModuloInput } from "@/types/cursos"

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
    console.warn('⚠️ [Modulos API] Erro ao verificar autenticação:', authError)
  }
  
  return { isAdmin, user }
}

export async function GET(
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

    // Se for admin, usar adminClient para bypassar RLS
    // Se não for admin, usar cliente normal que respeita RLS
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const client = isAdmin ? adminClient : supabase

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    // Verificar se o curso existe e está ativo (se não for admin)
    const cursoQuery = client
      .from('cursos')
      .select('id, is_active')
      .eq('id', params.id)
      .single()
    
    if (!isAdmin) {
      cursoQuery.eq('is_active', true)
    }
    
    const { data: curso, error: cursoError } = await cursoQuery
    
    if (cursoError || !curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }
    
    let query = client
      .from('modulos')
      .select('*')
      .eq('curso_id', params.id)
      .order('ordem', { ascending: true })
    
    if (!isAdmin || !includeInactive) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar módulos", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      modulos: data || []
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
        { error: "Acesso negado. Apenas administradores podem criar módulos." },
        { status: 403 }
      )
    }

    const body: CreateModuloInput = await request.json()
    
    if (!body.nome) {
      return NextResponse.json(
        { error: "Nome do módulo é obrigatório" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Verificar se o curso existe
    const { data: curso, error: cursoError } = await adminClient
      .from('cursos')
      .select('id')
      .eq('id', params.id)
      .single()
    
    if (cursoError || !curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }
    const { data, error } = await adminClient
      .from('modulos')
      .insert({
        curso_id: params.id,
        nome: body.nome,
        descricao: body.descricao || null,
        ordem: body.ordem ?? 0,
        is_active: body.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [Modulos API] Erro ao inserir módulo:', error)
      return NextResponse.json(
        { error: "Erro ao criar módulo", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      modulo: data
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ [Modulos API] Erro geral no POST:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

