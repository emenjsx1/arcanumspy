import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Listar posts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Tentar autenticar via cookies primeiro
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar, tentar via header Authorization
    if (!user && authError) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
        user = userFromToken
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const communityId = searchParams.get('community_id')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('community_posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (communityId) {
      query = query.eq('community_id', communityId)
    }

    if (category && category !== 'todos') {
      query = query.eq('category', category)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Erro ao buscar posts:', error)
      return NextResponse.json(
        { error: "Erro ao buscar posts", details: error.message },
        { status: 500 }
      )
    }

    // Buscar perfis dos usuários separadamente se necessário
    const postsWithProfiles = await Promise.all(
      (posts || []).map(async (post: any) => {
        if (post.profiles) {
          return post
        }
        // Se não veio o perfil no join, buscar separadamente
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('id', post.user_id)
            .single()
          return {
            ...post,
            profiles: profile || null
          }
        } catch {
          return {
            ...post,
            profiles: null
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      posts: postsWithProfiles,
      total: postsWithProfiles?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// POST - Criar post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Tentar autenticar via cookies primeiro
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar, tentar via header Authorization
    if (!user && authError) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
        user = userFromToken
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { community_id, title, content, category, image_url } = body

    if (!community_id || !content) {
      return NextResponse.json(
        { error: "community_id e content são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se a comunidade existe e está ativa - usar maybeSingle para melhor tratamento
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, is_active')
      .eq('id', community_id)
      .maybeSingle()

    // Verificar se é erro de "não encontrado" ou outro erro
    if (communityError) {
      console.error('❌ Erro ao buscar comunidade:', communityError)
      // Se for erro PGRST116 (não encontrado), retornar mensagem específica
      if (communityError.code === 'PGRST116' || communityError.message?.includes('No rows')) {
        return NextResponse.json(
          { error: "Comunidade não encontrada. Verifique se o ID está correto." },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: "Erro ao verificar comunidade", details: communityError.message },
        { status: 500 }
      )
    }

    const communityData = community as { id: string; is_active: boolean } | null
    
    if (!communityData) {
      return NextResponse.json(
        { error: "Comunidade não encontrada. Verifique se o ID está correto." },
        { status: 404 }
      )
    }

    if (!communityData.is_active) {
      return NextResponse.json(
        { error: "Esta comunidade não está ativa no momento" },
        { status: 403 }
      )
    }

    // Permitir que qualquer usuário autenticado possa postar (comunidade aberta)
    // Se necessário, adicionar o usuário automaticamente como membro
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('community_id', community_id)
      .maybeSingle()

    // Se não for membro, adicionar automaticamente (ignorar erro se já existir)
    if (!membership) {
      const { error: membershipError } = await (supabase
        .from('community_members') as any)
        .upsert({
          user_id: user.id,
          community_id: community_id,
          joined_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,community_id'
        })

      // Ignorar erro de duplicata (já é membro)
      if (membershipError && membershipError.code !== '23505') {
        console.warn('⚠️ Erro ao adicionar membro (continuando mesmo assim):', membershipError)
      }
    }

    const { data: post, error } = await (supabase
      .from('community_posts') as any)
      .insert({
        user_id: user.id,
        community_id,
        title: title || "Sem título",
        content,
        category: category || 'geral',
        image_url: image_url || null
      })
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar post:', error)
      return NextResponse.json(
        { error: "Erro ao criar post", details: error.message },
        { status: 500 }
      )
    }

    // Buscar perfil do usuário
    let profile = null
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', user.id)
        .single()
      profile = profileData
    } catch {
      // Ignorar erro se perfil não existir
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        profiles: profile
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

