import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/isAuthenticated"

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
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
      .from('copies_criativas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/ias/copies-criativas] Erro ao buscar copys:', error)
      
      // Verificar se é erro de tabela não encontrada
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json(
          { 
            success: true,
            copies: [],
            message: "Tabela não encontrada. Execute a migration 057_create_copies_criativas.sql no Supabase."
          }
        )
      }

      return NextResponse.json(
        { error: "Erro ao buscar copys", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      copies: data || []
    })
  } catch (error: any) {
    console.error('[GET /api/ias/copies-criativas] Erro inesperado:', error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar requisição"
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('copies_criativas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/ias/copies-criativas] Erro ao deletar copy:', error)
      return NextResponse.json(
        { error: "Erro ao deletar copy", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('[DELETE /api/ias/copies-criativas] Erro inesperado:', error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar requisição"
      },
      { status: 500 }
    )
  }
}







