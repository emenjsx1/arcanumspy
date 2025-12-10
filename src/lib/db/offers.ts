import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Offer = Database['public']['Tables']['offers']['Row']
type OfferInsert = Database['public']['Tables']['offers']['Insert']
type OfferUpdate = Database['public']['Tables']['offers']['Update']

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
  }
}

export interface OfferFilters {
  category?: string
  niche_id?: string
  country?: string
  language?: string
  funnel_type?: string
  temperature?: string
  product_type?: string
  search?: string
}

export async function getOffers(filters?: OfferFilters, limit = 50, offset = 0) {
  try {
    // A tabela niches não existe, usar apenas category
    let query = supabase
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }
    // niche_id não existe na tabela, usar o campo niche (TEXT) se necessário
    if (filters?.niche_id) {
      // Se houver filtro por niche_id, ignorar pois não existe na tabela
      // O campo niche é TEXT, não uma foreign key
    }
    if (filters?.country) {
      query = query.eq('country', filters.country)
    }
    if (filters?.language) {
      query = query.eq('language', filters.language)
    }
    if (filters?.funnel_type) {
      query = query.eq('funnel_type', filters.funnel_type)
    }
    if (filters?.temperature) {
      query = query.eq('temperature', filters.temperature)
    }
    if (filters?.product_type) {
      query = query.eq('product_type', filters.product_type)
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    // If error is about niche relationship, try without it
    if (error && (error.message?.includes('niches') || error.code === 'PGRST116' || error.code === '42P01')) {
      let fallbackQuery = supabase
        .from('offers')
        .select(`
          *,
          category:categories(id, name, slug, emoji)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (filters?.category) {
        fallbackQuery = fallbackQuery.eq('category_id', filters.category)
      }
      if (filters?.country) {
        fallbackQuery = fallbackQuery.eq('country', filters.country)
      }
      if (filters?.language) {
        fallbackQuery = fallbackQuery.eq('language', filters.language)
      }
      if (filters?.funnel_type) {
        fallbackQuery = fallbackQuery.eq('funnel_type', filters.funnel_type)
      }
      if (filters?.temperature) {
        fallbackQuery = fallbackQuery.eq('temperature', filters.temperature)
      }
      if (filters?.product_type) {
        fallbackQuery = fallbackQuery.eq('product_type', filters.product_type)
      }
      if (filters?.search) {
        fallbackQuery = fallbackQuery.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery
      if (fallbackError) throw fallbackError
      return (fallbackData || []) as OfferWithCategory[]
    }

    if (error) throw error

    return (data || []) as OfferWithCategory[]
  } catch (error) {
    console.error('Error fetching offers:', error)
    return []
  }
}

export async function getOfferById(id: string): Promise<OfferWithCategory | null> {
  try {
    // Buscar oferta (incluindo inativas para admin poder ver)
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('id', id)
      .single()

    if (error) {
      // Se não encontrar, tentar sem filtro is_active (pode ser oferta inativa)
      if (error.code === 'PGRST116') {
        console.warn('Oferta não encontrada ou inativa:', id)
      }
      throw error
    }

    return data as OfferWithCategory
  } catch (error) {
    console.error('Error fetching offer:', error)
    return null
  }
}

export async function getHotOffers(limit = 10): Promise<OfferWithCategory[]> {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('is_active', true)
      .eq('temperature', 'hot')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // Se temperature não existir ou der erro, buscar sem filtro
      if (error.code === '42703' || error.message?.includes('temperature')) {
        console.warn('⚠️ [getHotOffers] Campo temperature não encontrado, buscando sem filtro...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('offers')
          .select(`
            *,
            category:categories(id, name, slug, emoji)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (fallbackError) {
          console.error('❌ [getHotOffers] Erro ao buscar ofertas:', fallbackError)
          return []
        }
        
        const time = Date.now() - startTime
        return (fallbackData || []) as OfferWithCategory[]
      }
      throw error
    }

    const time = Date.now() - startTime
    return (data || []) as OfferWithCategory[]
  } catch (error) {
    console.error('❌ [getHotOffers] Erro ao buscar ofertas quentes:', error)
    return []
  }
}

export async function getNewOffers(limit = 10, days = 7): Promise<OfferWithCategory[]> {
  const startTime = Date.now()
  
  try {
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - days)
    dateLimit.setHours(0, 0, 0, 0) // Início do dia para incluir todas as ofertas do dia

    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('is_active', true)
      .gte('created_at', dateLimit.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ [getNewOffers] Erro na query:', error)
      throw error
    }

    const time = Date.now() - startTime

    return (data || []) as OfferWithCategory[]
  } catch (error) {
    console.error('❌ [getNewOffers] Erro ao buscar ofertas novas:', error)
    return []
  }
}

export async function getScaledOffers(limit = 10): Promise<OfferWithCategory[]> {
  const startTime = Date.now()
  
  try {
    // Simplified query - just get recent active offers
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ [getScaledOffers] Erro ao buscar ofertas:', error)
      return []
    }

    const time = Date.now() - startTime
    return (data || []) as OfferWithCategory[]
  } catch (error) {
    console.error('❌ [getScaledOffers] Erro ao buscar ofertas escalando:', error)
    return []
  }
}

export async function registerOfferView(offerId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Sistema baseado em planos - não há mais cobrança de créditos
    // Registrar visualização na tabela offer_views (para histórico)
    const { error: viewError } = await supabase
      .from('offer_views')
      .insert({
        user_id: user.id,
        offer_id: offerId,
      })

    if (viewError) {
      // Se for erro de duplicata, não é problema (já foi visualizada)
      if (viewError.code !== '23505') {
        console.warn('⚠️ [registerOfferView] Erro ao registrar visualização:', viewError.message)
      }
    }

    // Registrar atividade na tabela user_activities (se disponível)
    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          type: 'OFFER_VIEW',
          offer_id: offerId,
          credits_used: 0, // Mantido para compatibilidade, mas não há mais cobrança
          metadata: { offer_id: offerId, action: 'view' }
        })
    } catch (activityError: any) {
      // Se a tabela não existir, apenas logar (não bloquear)
      if (activityError?.code !== '42P01' && activityError?.code !== 'PGRST202') {
        console.warn('⚠️ [registerOfferView] Erro ao registrar atividade:', activityError.message)
      }
    }
  } catch (error) {
    console.error('❌ [registerOfferView] Erro ao registrar visualização:', error)
  }
}

