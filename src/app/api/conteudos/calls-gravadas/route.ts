import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
    console.error('⚠️ [Calls API] Erro ao verificar autenticação:', authError)
  }
  
  return { isAdmin, user }
}

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

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'
    
    // Verificar se é admin sem fazer chamada extra
    let isAdmin = false
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.role === 'admin'
    } catch (profileError) {
      // Se falhar, não é admin
      console.warn('⚠️ [Calls API] Erro ao verificar perfil:', profileError)
    }

    // Buscar calls gravadas
    let query = supabase
      .from('calls_gravadas')
      .select('*')
      .order('data_call', { ascending: false })
    
    const shouldFilterActive = !isAdmin || !includeInactive
    
    if (shouldFilterActive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ [Calls API] Erro ao buscar calls:', error)
      
      // Se a tabela não existir, retornar array vazio em vez de erro
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️ [Calls API] Tabela calls_gravadas não existe. Execute a migration 046_create_calls_gravadas.sql')
        return NextResponse.json({
          success: true,
          calls: []
        })
      }
      
      return NextResponse.json(
        { error: "Erro ao buscar calls", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      calls: data || []
    })
  } catch (error: any) {
    console.error('❌ [Calls API] Erro geral no GET:', error)
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
        { error: "Acesso negado. Apenas administradores podem criar calls." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nome, video_url, data_call, is_active } = body

    if (!nome || !video_url || !data_call) {
      return NextResponse.json(
        { error: "Nome, URL do vídeo e data são obrigatórios" },
        { status: 400 }
      )
    }

    // Garantir que is_active seja um booleano
    const isActive = typeof is_active === 'boolean' ? is_active : (is_active !== false && is_active !== 'false')
    

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('calls_gravadas')
      .insert({
        nome,
        video_url,
        data_call,
        is_active: isActive
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [Calls API] Erro ao inserir call:', error)
      
      // Se a tabela não existir, informar o usuário
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: "Tabela calls_gravadas não existe. Execute a migration 046_create_calls_gravadas.sql", details: error.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: "Erro ao criar call", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      call: data
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ [Calls API] Erro geral:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

