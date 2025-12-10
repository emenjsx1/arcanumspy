import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { UpdateCursoInput } from "@/types/cursos"
import { Database } from "@/types/database"

type Profile = Database['public']['Tables']['profiles']['Row']

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

      const profileData = profile as Pick<Profile, 'role'> | null
      isAdmin = profileData?.role === 'admin'
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

          const profileDataToken = profile as Pick<Profile, 'role'> | null
          isAdmin = profileDataToken?.role === 'admin'
        }
      }
    }
  } catch (authError) {
    console.error('⚠️ [Cursos API] Erro ao verificar autenticação:', authError)
  }
  
  return { isAdmin, user }
}

// GET - Buscar curso específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { isAdmin, user } = await checkAdmin(request)
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    let query = supabase
      .from('cursos')
      .select('*')
      .eq('id', params.id)
    
    if (!isAdmin) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query.single()

    if (error) {
      return NextResponse.json(
        { error: "Curso não encontrado", details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      curso: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar curso
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
        { error: "Acesso negado. Apenas administradores podem atualizar cursos." },
        { status: 403 }
      )
    }

    const body: UpdateCursoInput = await request.json()
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    if (body.nome !== undefined) updateData.nome = body.nome
    if (body.descricao !== undefined) updateData.descricao = body.descricao
    if (body.imagem_url !== undefined) updateData.imagem_url = body.imagem_url
    if (body.ordem !== undefined) updateData.ordem = body.ordem
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    
    const adminClient = createAdminClient()
    
    const { data, error } = await (adminClient
      .from('cursos') as any)
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar curso", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      curso: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar curso
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
        { error: "Acesso negado. Apenas administradores podem deletar cursos." },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    
    const { error } = await adminClient
      .from('cursos')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar curso", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Curso deletado com sucesso"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}
