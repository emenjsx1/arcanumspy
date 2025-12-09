import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { UpdateModuloInput } from "@/types/cursos"

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
    console.error('⚠️ [Modulos API] Erro ao verificar autenticação:', authError)
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

    const supabase = await createClient()
    
    let query = supabase
      .from('modulos')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!isAdmin) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar módulo", details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Módulo não encontrado" },
        { status: 404 }
      )
    }

    // Se não for admin, verificar se o curso está ativo
    if (!isAdmin) {
      const { data: curso } = await supabase
        .from('cursos')
        .select('id, is_active')
        .eq('id', data.curso_id)
        .eq('is_active', true)
        .single()
      
      if (!curso) {
        return NextResponse.json(
          { error: "Curso não encontrado ou inativo" },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      modulo: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function PUT(
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
        { error: "Acesso negado. Apenas administradores podem atualizar módulos." },
        { status: 403 }
      )
    }

    const body: UpdateModuloInput = await request.json()
    
    const updateData: any = {}
    if (body.nome !== undefined) updateData.nome = body.nome
    if (body.descricao !== undefined) updateData.descricao = body.descricao
    if (body.ordem !== undefined) updateData.ordem = body.ordem
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('modulos')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar módulo", details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Módulo não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      modulo: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { error: "Acesso negado. Apenas administradores podem deletar módulos." },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('modulos')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar módulo", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Módulo deletado com sucesso"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

