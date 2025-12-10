import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"

type Offer = Database['public']['Tables']['offers']['Row']

export interface OfferWithCategory extends Offer {
  category?: {
    id: string
    name: string
    slug: string
    emoji: string | null
  }
  niche?: {
    id: string
    name: string
    slug: string
  } | null
}

export interface OfferFilters {
  category?: string
  niche_id?: string
  country?: string
  // language column não existe na tabela offers - removido
  funnel_type?: string
  temperature?: string
  product_type?: string
  search?: string
}

export async function GET(request: NextRequest) {
  try {
    // IMPORTANTE: Criar client com token do header para garantir que RLS funcione
    // O problema é que o createClient() do servidor pode não estar passando o token corretamente
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    let supabase: any
    let user: any = null
    let authError: any = null
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    
    // Se houver token no header, usar ele para criar um client autenticado
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Criar client com token no header para garantir autenticação
      supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
      
      const { data: { user: userFromToken }, error: tokenError } = await supabase.auth.getUser(token)
      if (userFromToken) {
        user = userFromToken
        console.log('✅ [API /offers] Usuário autenticado via token:', user.id)
      } else {
        authError = tokenError
        console.error('❌ [API /offers] Erro ao autenticar via token:', tokenError)
      }
    } else {
      // Tentar autenticar via cookies usando createClient do servidor
      supabase = await createClient()
      const { data: { user: userFromCookies }, error: cookiesError } = await supabase.auth.getUser()
      user = userFromCookies
      authError = cookiesError
      
      if (user) {
        console.log('✅ [API /offers] Usuário autenticado via cookies:', user.id)
      } else {
        console.error('❌ [API /offers] Erro ao autenticar via cookies:', cookiesError)
      }
    }

    if (authError || !user) {
      console.error('❌ [API /offers] Erro de autenticação:', {
        hasUser: !!user,
        error: authError?.message,
        code: authError?.code
      })
      return NextResponse.json(
        { 
          error: "Não autenticado",
          details: authError?.message || "Sessão não encontrada",
          hint: "Faça login novamente"
        },
        { status: 401 }
      )
    }

    console.log('✅ [API /offers] Usuário autenticado:', {
      userId: user.id,
      email: user.email
    })

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const filters: OfferFilters = {
      category: searchParams.get('category') || undefined,
      niche_id: searchParams.get('niche_id') || undefined,
      country: searchParams.get('country') || undefined,
      // language column não existe na tabela offers - removido
      funnel_type: searchParams.get('funnel_type') || undefined,
      temperature: searchParams.get('temperature') || undefined,
      product_type: searchParams.get('product_type') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Debug: verificar se há ofertas acessíveis (RLS já filtra por is_active = true)
    // IMPORTANTE: A política RLS só permite ver ofertas com is_active = true
    // Se as ofertas não aparecem, verifique se elas têm is_active = true no banco
    const { data: allOffers, error: allOffersError } = await supabase
      .from('offers')
      .select('id, title, is_active, created_at')
      .limit(10)
    
    if (allOffersError) {
      console.error('❌ [API /offers] Erro ao verificar ofertas (debug):', {
        message: allOffersError.message,
        code: allOffersError.code,
        details: allOffersError.details,
        hint: allOffersError.hint
      })
    } else {
      console.log('🔍 [API /offers] Debug - Ofertas acessíveis via RLS:', allOffers?.length || 0)
      if (allOffers && allOffers.length > 0) {
        console.log('✅ [API /offers] Exemplos de ofertas acessíveis:')
        allOffers.forEach((offer: any, idx: number) => {
          console.log(`  ${idx + 1}. ${offer.title} (is_active: ${offer.is_active})`)
        })
      } else {
        console.warn('⚠️ [API /offers] NENHUMA OFERTA ENCONTRADA!')
        console.warn('⚠️ [API /offers] Possíveis causas:')
        console.warn('  1. Nenhuma oferta tem is_active = true no banco')
        console.warn('  2. Problema com política RLS')
        console.warn('  3. Usuário não está autenticado corretamente')
        console.warn('  4. Verifique no Supabase se as ofertas têm is_active = true')
      }
    }

    // IMPORTANTE: O join com categories pode estar causando problema com RLS
    // Vamos buscar todas as ofertas sem join primeiro e depois buscar categorias separadamente
    console.log('🔍 [API /offers] Buscando ofertas sem join (mais confiável com RLS)...')
    
    // Construir query sem join
    let queryWithoutJoin = supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Aplicar filtros
    if (filters.category) {
      queryWithoutJoin = queryWithoutJoin.eq('category_id', filters.category)
    }
    if (filters.country) {
      queryWithoutJoin = queryWithoutJoin.eq('country', filters.country)
    }
    if (filters.funnel_type) {
      queryWithoutJoin = queryWithoutJoin.eq('funnel_type', filters.funnel_type)
    }
    if (filters.temperature) {
      queryWithoutJoin = queryWithoutJoin.eq('temperature', filters.temperature)
    }
    if (filters.product_type) {
      queryWithoutJoin = queryWithoutJoin.eq('product_type', filters.product_type)
    }
    if (filters.search) {
      queryWithoutJoin = queryWithoutJoin.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
    }
    
    // Aplicar paginação
    queryWithoutJoin = queryWithoutJoin.range(offset, offset + limit - 1)
    
    const { data: offersData, error: offersError } = await queryWithoutJoin
    
    if (offersError) {
      console.error('❌ [API /offers] Erro ao buscar ofertas sem join:', {
        message: offersError.message,
        code: offersError.code,
        details: offersError.details,
        hint: offersError.hint
      })
    } else {
      console.log('✅ [API /offers] Ofertas encontradas sem join:', offersData?.length || 0)
    }
    
    // Se encontrou ofertas, buscar categorias separadamente
    if (offersData && offersData.length > 0) {
      console.log('🔍 [API /offers] Buscando categorias separadamente...')
      
      // Buscar categorias separadamente
      const categoryIds = [...new Set(offersData.map((o: any) => o.category_id).filter(Boolean))]
      let categoriesMap: Record<string, any> = {}
      
      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, slug, emoji')
          .in('id', categoryIds)
        
        if (categoriesError) {
          console.warn('⚠️ [API /offers] Erro ao buscar categorias:', categoriesError.message)
        } else if (categoriesData) {
          (categoriesData as any[]).forEach((cat: any) => {
            categoriesMap[cat.id] = cat
          })
          console.log('✅ [API /offers] Categorias encontradas:', categoriesData.length)
        }
      }
      
      // Buscar nichos separadamente
      const nicheIds = [...new Set(offersData.map((o: any) => o.niche_id).filter(Boolean))]
      let nichesMap: Record<string, any> = {}
      
      if (nicheIds.length > 0) {
        try {
          const { data: nichesData, error: nichesError } = await supabase
            .from('niches')
            .select('id, name, slug')
            .in('id', nicheIds)
          
          if (nichesError) {
            console.warn('⚠️ [API /offers] Erro ao buscar nichos:', nichesError.message)
          } else if (nichesData) {
            (nichesData as any[]).forEach((niche: any) => {
              nichesMap[niche.id] = niche
            })
            console.log('✅ [API /offers] Nichos encontrados:', nichesData.length)
          }
        } catch (nicheError: any) {
          console.warn('⚠️ [API /offers] Erro ao buscar nichos (tabela pode não existir):', nicheError.message)
        }
      }
      
      // Adicionar categorias e nichos às ofertas
      const offersWithCategories = offersData.map((offer: any) => ({
        ...offer,
        category: categoriesMap[offer.category_id] || null,
        niche: nichesMap[offer.niche_id] || null
      }))
      
      return NextResponse.json({
        success: true,
        offers: offersWithCategories,
        total: offersData.length
      })
    }
    
    // Se não encontrou ofertas sem join, tentar com join (fallback)
    console.log('⚠️ [API /offers] Nenhuma oferta encontrada sem join, tentando com join...')

    // Se a query simples não funcionou, tentar a query completa com join
    console.log('🔍 [API /offers] Tentando query completa com join...')
    let query = supabase
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji),
        niche:niches(id, name, slug)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (filters.category) {
      query = query.eq('category_id', filters.category)
    }
    if (filters.country) {
      query = query.eq('country', filters.country)
    }
    // language column não existe na tabela offers - removido
    if (filters.funnel_type) {
      query = query.eq('funnel_type', filters.funnel_type)
    }
    if (filters.temperature) {
      query = query.eq('temperature', filters.temperature)
    }
    if (filters.product_type) {
      query = query.eq('product_type', filters.product_type)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
    }

    console.log('🔍 [API /offers] Executando query com filtros:', {
      limit,
      offset,
      filters,
      note: 'RLS já filtra por is_active = true'
    })

    const { data, error } = await query

    console.log('🔍 [API /offers] Resultado da query:', {
      count: data?.length || 0,
      error: error?.message || null,
      errorCode: error?.code || null
    })

    // Se houver erro, tentar sem o join primeiro (pode ser problema com o join)
    if (error) {
      console.error('❌ [API /offers] Erro na query principal:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })

      console.log('🔍 [API /offers] Tentando query sem join com categories...')
      // Tentar query sem join primeiro
      let fallbackQuery = supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (filters.category) {
        fallbackQuery = fallbackQuery.eq('category_id', filters.category)
      }
      if (filters.country) {
        fallbackQuery = fallbackQuery.eq('country', filters.country)
      }
      if (filters.funnel_type) {
        fallbackQuery = fallbackQuery.eq('funnel_type', filters.funnel_type)
      }
      if (filters.temperature) {
        fallbackQuery = fallbackQuery.eq('temperature', filters.temperature)
      }
      if (filters.product_type) {
        fallbackQuery = fallbackQuery.eq('product_type', filters.product_type)
      }
      if (filters.search) {
        fallbackQuery = fallbackQuery.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery
      
      if (fallbackError) {
        console.error('❌ [API /offers] Erro na query fallback (sem join):', fallbackError)
        return NextResponse.json(
          { 
            error: "Erro ao buscar ofertas",
            details: fallbackError.message,
            code: fallbackError.code
          },
          { status: 500 }
        )
      }

      // Se funcionou sem join, tentar buscar categorias separadamente
      if (fallbackData && fallbackData.length > 0) {
        console.log('✅ [API /offers] Query sem join funcionou! Ofertas encontradas:', fallbackData.length)
        
        // Buscar categorias separadamente
        const categoryIds = [...new Set(fallbackData.map((o: any) => o.category_id).filter(Boolean))]
        let categoriesMap: Record<string, any> = {}
        
        if (categoryIds.length > 0) {
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('id, name, slug, emoji')
            .in('id', categoryIds)
          
          if (categoriesData) {
            categoriesData.forEach((cat: any) => {
              categoriesMap[cat.id] = cat
            })
          }
        }
        
        // Buscar nichos separadamente
        const nicheIds = [...new Set(fallbackData.map((o: any) => o.niche_id).filter(Boolean))]
        let nichesMap: Record<string, any> = {}
        
        if (nicheIds.length > 0) {
          try {
            const { data: nichesData, error: nichesError } = await supabase
              .from('niches')
              .select('id, name, slug')
              .in('id', nicheIds)
            
            if (nichesError) {
              console.warn('⚠️ [API /offers] Erro ao buscar nichos:', nichesError.message)
            } else if (nichesData) {
              nichesData.forEach((niche: any) => {
                nichesMap[niche.id] = niche
              })
            }
          } catch (nicheError: any) {
            console.warn('⚠️ [API /offers] Erro ao buscar nichos (tabela pode não existir):', nicheError.message)
          }
        }
        
        // Adicionar categorias e nichos às ofertas
        const offersWithCategories = fallbackData.map((offer: any) => ({
          ...offer,
          category: categoriesMap[offer.category_id] || null,
          niche: nichesMap[offer.niche_id] || null
        }))
        
        return NextResponse.json({
          success: true,
          offers: offersWithCategories,
          message: offersWithCategories.length === 0 
            ? "Nenhuma oferta encontrada. Verifique se há ofertas com is_active = true no banco de dados."
            : undefined
        })
      }

      // RLS já garante que apenas ofertas ativas são retornadas
      console.log('✅ [API /offers] Query fallback bem-sucedida:', {
        total: fallbackData?.length || 0
      })

      return NextResponse.json({
        success: true,
        offers: fallbackData || [],
        message: fallbackData && fallbackData.length === 0 
          ? "Nenhuma oferta encontrada. Verifique se há ofertas com is_active = true no banco de dados."
          : undefined
      })
    }

    // Se não houver ofertas, retornar mensagem mais clara
    if (!data || data.length === 0) {
      console.warn('⚠️ [API /offers] Nenhuma oferta retornada pela query')
      return NextResponse.json({
        success: true,
        offers: [],
        message: "Nenhuma oferta encontrada. Verifique se há ofertas com is_active = true no banco de dados.",
        debug: {
          totalChecked: allOffers?.length || 0,
          userAuthenticated: !!user,
          userId: user?.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      offers: data || []
    })
  } catch (error: any) {
    console.error('Error in /api/offers:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ofertas" },
      { status: 500 }
    )
  }
}

