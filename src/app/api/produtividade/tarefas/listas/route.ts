import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/isAuthenticated"

// GET - Buscar listas do usuário
export async function GET(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      console.error('[GET /api/produtividade/tarefas/listas] Erro de autenticação:', authError)
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
        console.log('[GET /api/produtividade/tarefas/listas] Criando cliente com token do header')
        
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

    console.log('[GET /api/produtividade/tarefas/listas] Buscando listas para user_id:', user.id)

    const { data, error } = await supabase
      .from('tarefa_listas')
      .select('*')
      .eq('user_id', user.id)
      .order('ordem', { ascending: true })

    console.log('[GET /api/produtividade/tarefas/listas] Resultado da query:', { data, error })

    if (error) {
      console.error('[GET /api/produtividade/tarefas/listas] Erro ao buscar listas:', error)
      
      // Verificar se é erro de tabela não encontrada
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json(
          { 
            error: "Tabela não encontrada. Execute a migration 051_fix_missing_tables.sql no Supabase.",
            details: error.message,
            hint: "Acesse o SQL Editor do Supabase e execute o arquivo supabase/migrations/051_fix_missing_tables.sql"
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: "Erro ao buscar listas", details: error.message, code: error.code },
        { status: 500 }
      )
    }

    const listas = data || []
    console.log('[GET /api/produtividade/tarefas/listas] Retornando', listas.length, 'listas')
    
    return NextResponse.json({
      success: true,
      listas: listas
    })
  } catch (error: any) {
    console.error('[GET /api/produtividade/tarefas/listas] Erro inesperado:', error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar requisição",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Criar nova lista
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      console.error('[POST /api/produtividade/tarefas/listas] Erro de autenticação:', authError)
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
        console.log('[POST /api/produtividade/tarefas/listas] Criando cliente com token do header')
        
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
        
        // Verificar se agora está autenticado
        const { data: { user: tokenUser } } = await supabase.auth.getUser()
        if (!tokenUser) {
          console.error('[POST /api/produtividade/tarefas/listas] Falha ao autenticar com token')
          return NextResponse.json(
            { error: "Falha na autenticação" },
            { status: 401 }
          )
        }
        console.log('[POST /api/produtividade/tarefas/listas] Autenticado via token:', tokenUser.id)
      } else {
        console.error('[POST /api/produtividade/tarefas/listas] Nenhum token de autenticação encontrado')
        return NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 }
        )
      }
    } else {
      console.log('[POST /api/produtividade/tarefas/listas] Autenticado via cookies:', supabaseUser.id)
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[POST /api/produtividade/tarefas/listas] Erro ao parsear JSON:', parseError)
      return NextResponse.json(
        { error: "Erro ao processar dados da requisição" },
        { status: 400 }
      )
    }

    const { nome, cor } = body

    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    // Primeiro, verificar se a tabela existe tentando uma query simples
    const { error: tableCheckError } = await supabase
      .from('tarefa_listas')
      .select('id')
      .limit(0)

    if (tableCheckError) {
      const errorMessage = tableCheckError.message || ''
      const errorCode = tableCheckError.code || ''
      
      console.error('[POST /api/produtividade/tarefas/listas] Tabela não existe ou erro de acesso:', {
        message: errorMessage,
        code: errorCode,
        details: tableCheckError.details,
        hint: tableCheckError.hint
      })

      // Verificar se é erro de tabela não encontrada
      if (errorMessage.includes('does not exist') || 
          errorCode === '42P01' || 
          errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: "Tabela 'tarefa_listas' não encontrada no banco de dados.",
            details: errorMessage,
            code: errorCode,
            solution: "Execute a migration 051_fix_missing_tables.sql no SQL Editor do Supabase",
            file: "supabase/migrations/051_fix_missing_tables.sql"
          },
          { status: 500 }
        )
      }

      // Verificar se é erro de RLS (Row Level Security)
      if (errorMessage.includes('permission denied') || errorCode === '42501') {
        return NextResponse.json(
          { 
            error: "Erro de permissão. As políticas RLS podem não estar configuradas.",
            details: errorMessage,
            code: errorCode,
            solution: "Execute a migration 051_fix_missing_tables.sql para configurar as políticas RLS"
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          error: "Erro ao acessar tabela", 
          details: errorMessage,
          code: errorCode,
          hint: tableCheckError.hint
        },
        { status: 500 }
      )
    }

    // Buscar maior ordem atual (com tratamento de erro)
    let ordem = 0
    try {
      const { data: existingLists, error: orderError } = await supabase
        .from('tarefa_listas')
        .select('ordem')
        .eq('user_id', user.id)
        .order('ordem', { ascending: false })
        .limit(1)

      if (orderError) {
        console.warn('[POST /api/produtividade/tarefas/listas] Erro ao buscar ordem:', orderError.message)
        ordem = 0
      } else {
        ordem = existingLists && existingLists.length > 0 
          ? (existingLists[0].ordem || 0) + 1 
          : 0
      }
    } catch (orderError: any) {
      console.warn('[POST /api/produtividade/tarefas/listas] Erro ao calcular ordem:', orderError.message)
      ordem = 0
    }

    // Inserir a nova lista
    const { data, error } = await supabase
      .from('tarefa_listas')
      .insert({
        user_id: user.id,
        nome: nome.trim(),
        cor: cor || '#3b82f6',
        ordem
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/produtividade/tarefas/listas] Erro ao inserir lista:', error)
      console.error('[POST /api/produtividade/tarefas/listas] Detalhes completos:', JSON.stringify(error, null, 2))
      
      // Verificar se é erro de tabela não encontrada
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json(
          { 
            error: "Tabela não encontrada. Execute a migration 051_fix_missing_tables.sql no Supabase.",
            details: error.message,
            code: error.code,
            solution: "Acesse o SQL Editor do Supabase e execute o arquivo supabase/migrations/051_fix_missing_tables.sql"
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
            error: "Erro de permissão RLS. Execute a migration 052_fix_tarefa_listas_rls.sql.",
            details: error.message,
            code: error.code,
            solution: "Acesse o SQL Editor do Supabase e execute supabase/migrations/052_fix_tarefa_listas_rls.sql",
            hint: error.hint
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          error: "Erro ao criar lista", 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    console.log('[POST /api/produtividade/tarefas/listas] Lista criada com sucesso:', JSON.stringify(data, null, 2))
    
    return NextResponse.json({
      success: true,
      lista: data
    })
  } catch (error: any) {
    console.error('[POST /api/produtividade/tarefas/listas] Erro inesperado:', error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar requisição",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar lista
export async function PATCH(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      console.error('[PATCH /api/produtividade/tarefas/listas] Erro de autenticação:', authError)
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
        console.log('[PATCH /api/produtividade/tarefas/listas] Criando cliente com token do header')
        
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
      console.error('[PATCH /api/produtividade/tarefas/listas] Erro ao parsear JSON:', parseError)
      return NextResponse.json(
        { error: "Erro ao processar dados da requisição" },
        { status: 400 }
      )
    }

    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      )
    }

    console.log('[PATCH /api/produtividade/tarefas/listas] Atualizando lista:', { id, updates, user_id: user.id })

    // Primeiro verificar se a lista existe e pertence ao usuário
    const { data: existingList, error: checkError } = await supabase
      .from('tarefa_listas')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingList) {
      console.error('[PATCH /api/produtividade/tarefas/listas] Lista não encontrada ou não pertence ao usuário:', checkError)
      return NextResponse.json(
        { error: "Lista não encontrada ou você não tem permissão para editá-la" },
        { status: 404 }
      )
    }

    // Atualizar a lista (sem .single() primeiro, depois buscar)
    const { error: updateError } = await supabase
      .from('tarefa_listas')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[PATCH /api/produtividade/tarefas/listas] Erro ao atualizar:', updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar lista", details: updateError.message, code: updateError.code },
        { status: 500 }
      )
    }

    // Buscar a lista atualizada
    const { data: updatedList, error: selectError } = await supabase
      .from('tarefa_listas')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (selectError || !updatedList) {
      console.error('[PATCH /api/produtividade/tarefas/listas] Erro ao buscar lista atualizada:', selectError)
      // Mesmo que não consiga buscar, a atualização foi feita, então retornar sucesso
      return NextResponse.json({
        success: true,
        lista: { id, ...updates }
      })
    }

    console.log('[PATCH /api/produtividade/tarefas/listas] Lista atualizada com sucesso:', updatedList)

    return NextResponse.json({
      success: true,
      lista: updatedList
    })
  } catch (error: any) {
    console.error('[PATCH /api/produtividade/tarefas/listas] Erro inesperado:', error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar requisição",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Deletar lista
export async function DELETE(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('tarefa_listas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar lista", details: error.message },
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


