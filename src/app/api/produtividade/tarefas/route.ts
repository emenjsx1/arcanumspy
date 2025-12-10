import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/isAuthenticated"

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      console.error('[GET /api/produtividade/tarefas] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Criar cliente Supabase - tentar com cookies primeiro
    let supabase = await createClient()
    
    // Verificar autenticação do cliente
    const { data: { user: supabaseUser }, error: supabaseAuthError } = await supabase.auth.getUser()
    
    // Se não estiver autenticado via cookies, tentar via header Authorization
    if (supabaseAuthError || !supabaseUser) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
      }
    }

    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/produtividade/tarefas] Erro ao buscar tarefas:', error)
      
      // Verificar se é erro de tabela não encontrada
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json(
          { 
            error: "Tabela 'tarefas' não encontrada. Execute a migration 051_fix_missing_tables.sql no Supabase.",
            details: error.message,
            code: error.code
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: "Erro ao buscar tarefas", details: error.message, code: error.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tarefas: data || []
    })
  } catch (error: any) {
    console.error('[GET /api/produtividade/tarefas] Erro inesperado:', error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar requisição",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      console.error('[POST /api/produtividade/tarefas] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Criar cliente Supabase - tentar com cookies primeiro
    let supabase = await createClient()
    
    // Verificar autenticação do cliente
    const { data: { user: supabaseUser }, error: supabaseAuthError } = await supabase.auth.getUser()
    
    // Se não estiver autenticado via cookies, tentar via header Authorization
    if (supabaseAuthError || !supabaseUser) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        console.log('[POST /api/produtividade/tarefas] Criando cliente com token do header')
        
        // Criar cliente com token explicitamente
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
      }
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[POST /api/produtividade/tarefas] Erro ao parsear JSON:', parseError)
      return NextResponse.json(
        { error: "Erro ao processar dados da requisição" },
        { status: 400 }
      )
    }

    const { titulo, descricao, prioridade, prazo, lista_id } = body

    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se a tabela existe
    const { error: tableCheckError } = await supabase
      .from('tarefas')
      .select('id')
      .limit(0)

    if (tableCheckError) {
      const errorMessage = tableCheckError.message || ''
      const errorCode = tableCheckError.code || ''
      
      console.error('[POST /api/produtividade/tarefas] Tabela não existe ou erro de acesso:', {
        message: errorMessage,
        code: errorCode
      })

      if (errorMessage.includes('does not exist') || errorCode === '42P01') {
        return NextResponse.json(
          { 
            error: "Tabela 'tarefas' não encontrada. Execute a migration 051_fix_missing_tables.sql no Supabase.",
            details: errorMessage,
            code: errorCode
          },
          { status: 500 }
        )
      }

      if (errorMessage.includes('permission denied') || errorCode === '42501') {
        return NextResponse.json(
          { 
            error: "Erro de permissão RLS. Execute a migration 051_fix_missing_tables.sql.",
            details: errorMessage,
            code: errorCode
          },
          { status: 500 }
        )
      }
    }

    const { data, error } = await (supabase
      .from('tarefas') as any)
      .insert({
        user_id: user.id,
        titulo: titulo.trim(),
        descricao: descricao || null,
        prioridade: prioridade || 'media',
        prazo: prazo || null,
        lista_id: lista_id || null,
        concluida: false
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/produtividade/tarefas] Erro ao inserir tarefa:', error)
      console.error('[POST /api/produtividade/tarefas] Detalhes completos:', JSON.stringify(error, null, 2))
      
      // Verificar se é erro de tabela não encontrada
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json(
          { 
            error: "Tabela não encontrada. Execute a migration 051_fix_missing_tables.sql no Supabase.",
            details: error.message,
            code: error.code
          },
          { status: 500 }
        )
      }

      // Verificar se é erro de RLS
      if (error.message?.includes('permission denied') || 
          error.message?.includes('row-level security policy') ||
          error.code === '42501') {
        return NextResponse.json(
          { 
            error: "Erro de permissão RLS. Execute a migration 051_fix_missing_tables.sql.",
            details: error.message,
            code: error.code
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          error: "Erro ao criar tarefa", 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    console.log('[POST /api/produtividade/tarefas] Tarefa criada com sucesso:', JSON.stringify(data, null, 2))

    return NextResponse.json({
      success: true,
      tarefa: data
    })
  } catch (error: any) {
    console.error('[POST /api/produtividade/tarefas] Erro inesperado:', error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar requisição",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase
      .from('tarefas') as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar tarefa", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tarefa: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar tarefa", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

