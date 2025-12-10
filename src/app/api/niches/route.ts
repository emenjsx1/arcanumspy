import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAllNiches, getNichesByCategory } from "@/lib/db/niches"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    // Try to get user from cookies first
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        // Create a new client with the token
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    const categoryId = searchParams.get('category_id')

    // Usar adminClient para bypassar RLS e garantir que todos os nichos sejam retornados
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError: any) {
      console.error('❌ [API /niches] Erro ao criar admin client:', adminError)
      // Se não conseguir criar admin client, tentar com cliente normal
      let niches
      if (categoryId) {
        niches = await getNichesByCategory(categoryId)
      } else {
        niches = await getAllNiches()
      }
      return NextResponse.json({ niches })
    }

    // Buscar nichos usando adminClient (bypass RLS)
    // Para admin, buscar todos os nichos (incluindo inativos) para ter visibilidade completa
    let query = adminClient
      .from('niches')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .order('name', { ascending: true })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    // Filtrar apenas ativos (mas admin pode ver todos se necessário)
    // Removendo o filtro is_active para admin ver todos os nichos
    // Se quiser apenas ativos, descomente a linha abaixo:
    // query = query.eq('is_active', true)

    const { data: niches, error: nichesError } = await query

    if (nichesError) {
      console.error('❌ [API /niches] Erro ao buscar nichos:', nichesError)
      // Se der erro, tentar com função normal
      let fallbackNiches
      if (categoryId) {
        fallbackNiches = await getNichesByCategory(categoryId)
      } else {
        fallbackNiches = await getAllNiches()
      }
      return NextResponse.json({ niches: fallbackNiches })
    }

    return NextResponse.json({ niches: niches || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar nichos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get user from cookies first
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        // Create a new client with the token
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
        }
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, category_id, slug } = body

    if (!name || !category_id) {
      return NextResponse.json(
        { error: "Nome e categoria são obrigatórios" },
        { status: 400 }
      )
    }

    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError: any) {
      console.error('Erro ao criar admin client:', adminError)
      return NextResponse.json(
        { error: adminError.message || "Erro de configuração do servidor" },
        { status: 500 }
      )
    }

    // Verificar se o usuário é admin antes de criar (usando adminClient para bypass RLS)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado. Apenas administradores podem criar nichos." },
        { status: 403 }
      )
    }

    // Verificar se a categoria existe
    const { data: category, error: categoryError } = await adminClient
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single()

    if (categoryError || !category) {
      console.error('Erro ao verificar categoria:', categoryError)
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 400 }
      )
    }

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-')

    // Verificar se já existe um nicho com esse slug
    const { data: existingNiche } = await adminClient
      .from('niches')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle()

    if (existingNiche) {
      return NextResponse.json(
        { error: `Já existe um nicho com o slug "${finalSlug}"` },
        { status: 400 }
      )
    }

    const { data: niche, error } = await (adminClient
      .from('niches') as any)
      .insert({
        name,
        slug: finalSlug,
        category_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar nicho:', error)
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // Se a tabela não existe, dar uma mensagem mais clara
      if (error.message?.includes('schema cache') || error.message?.includes('not found') || error.code === 'PGRST202' || error.code === '42P01') {
        return NextResponse.json(
          { 
            error: "A tabela 'niches' não foi encontrada no banco de dados. Por favor, execute a migração 017_ensure_niches_table.sql no Supabase.",
            code: error.code || 'TABLE_NOT_FOUND',
            details: error.details || null
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.message || "Erro ao criar nicho",
          details: error.details || null,
          code: error.code || null
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      niche 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar nicho" },
      { status: 500 }
    )
  }
}

