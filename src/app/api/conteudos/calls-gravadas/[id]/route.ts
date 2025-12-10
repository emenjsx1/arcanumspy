import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
    console.error('⚠️ [Calls API] Erro ao verificar autenticação:', authError)
  }
  
  return { isAdmin, user }
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
        { error: "Acesso negado. Apenas administradores podem atualizar calls." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nome, video_url, data_call, is_active } = body

    const adminClient = createAdminClient()
    const updateData: any = {}
    if (nome !== undefined) updateData.nome = nome
    if (video_url !== undefined) updateData.video_url = video_url
    if (data_call !== undefined) updateData.data_call = data_call
    if (is_active !== undefined) {
      // Garantir que is_active seja um booleano
      updateData.is_active = typeof is_active === 'boolean' ? is_active : (is_active !== false && is_active !== 'false')
    }

    const { data, error } = await (adminClient
      .from('calls_gravadas') as any)
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar call", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      call: data
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
        { error: "Acesso negado. Apenas administradores podem deletar calls." },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('calls_gravadas')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar call", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Call deletada com sucesso"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

