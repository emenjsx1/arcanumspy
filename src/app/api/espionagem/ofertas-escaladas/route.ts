import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAuthenticatedServer } from '@/lib/auth/isAuthenticated'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação usando função reutilizável
    const authenticated = await isAuthenticatedServer(request)
    
    if (!authenticated) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login para continuar." },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // Se falhar via cookies, tentar via header
    if (!user && authError) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const nicho = searchParams.get('nicho')
    const formato = searchParams.get('formato')
    const idioma = searchParams.get('idioma')
    // language column não existe na tabela offers - removido
    const ticket = searchParams.get('ticket')
    const busca = searchParams.get('busca')
    const ordenar = searchParams.get('ordenar') || 'mais_recente'
    const category = searchParams.get('category')
    const temperature = searchParams.get('temperature')
    const funnel_type = searchParams.get('funnel_type')
    const product_type = searchParams.get('product_type')

    // CORREÇÃO: Usar a tabela 'offers' (mesma da library) em vez de 'ofertas'
    let query = supabase
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('is_active', true) // Apenas ofertas ativas

    // Filtro por categoria (mesmo que library)
    if (category) {
      query = query.eq('category_id', category)
    }

    // Filtro por status/temperature (escalando = hot)
    if (status && status !== 'todos') {
      if (status === 'escalando') {
        query = query.eq('temperature', 'hot')
      } else if (status === 'pre-escala') {
        query = query.eq('temperature', 'warm')
      } else if (status === 'validando') {
        query = query.eq('temperature', 'cold')
      }
    }

    // Filtro por temperature (se fornecido diretamente)
    if (temperature) {
      query = query.eq('temperature', temperature)
    }

    // Filtro por nicho (campo niche na tabela offers)
    if (nicho && nicho !== 'todos') {
      query = query.eq('niche', nicho)
    }

    // Filtro por formato (page_type ou funnel_type)
    if (formato && formato !== 'todos') {
      // Tentar ambos os campos
      query = query.or(`page_type.eq.${formato},funnel_type.eq.${formato}`)
    }

    // Filtro por funnel_type (se fornecido diretamente)
    if (funnel_type) {
      query = query.eq('funnel_type', funnel_type)
    }

    // Filtro por idioma/país (campo country) - mantido para compatibilidade
    if (idioma && idioma !== 'todos') {
      query = query.eq('country', idioma)
    }

    // Filtro por país (se fornecido diretamente)
    if (searchParams.get('country')) {
      query = query.eq('country', searchParams.get('country'))
    }

    // language column não existe na tabela offers - filtro removido

    // Filtro por product_type (se fornecido diretamente)
    if (product_type) {
      query = query.eq('product_type', product_type)
    }

    // Filtro por ticket médio (precisa verificar se existe campo price ou similar)
    // Por enquanto, vamos ignorar este filtro se não houver campo correspondente

    // Busca por texto (title e short_description, mesmo que library)
    if (busca) {
      query = query.or(`title.ilike.%${busca}%,short_description.ilike.%${busca}%`)
    }

    // Ordenação
    if (ordenar === 'mais_recente') {
      query = query.order('created_at', { ascending: false })
    } else if (ordenar === 'mais_antigo') {
      query = query.order('created_at', { ascending: true })
    } else if (ordenar === 'mais_like') {
      query = query.order('likes_count', { ascending: false, nullsFirst: false })
    } else if (ordenar === 'maior_roas') {
      // Se houver campo roas, ordenar por ele
      query = query.order('created_at', { ascending: false })
    } else if (ordenar === 'mais_anuncio') {
      // Se houver campo de anúncios, ordenar por ele
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar ofertas escaladas:', error)
      return NextResponse.json(
        { error: "Erro ao buscar ofertas", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ofertas: data || [],
      total: data?.length || 0
    })
  } catch (error: any) {
    console.error('Erro ao processar requisição de ofertas escaladas:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

