import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { OfferWithCategory } from './offers-server'

export async function getRecommendedOffers(limit = 6): Promise<OfferWithCategory[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('⚠️ [getRecommendedOffers] Usuário não autenticado')
      return []
    }

    // Get user's most viewed categories
    const { data: views } = await supabase
      .from('offer_views')
      .select('offer:offers(category_id)')
      .eq('user_id', user.id)
      .limit(50)

    const categoryCounts: Record<string, number> = {}
    views?.forEach((v: any) => {
      const catId = v.offer?.category_id
      if (catId) {
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1
      }
    })

    const topCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0]

    // Get offers from top category or hot offers
    let query = supabase
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (topCategory) {
      query = query.eq('category_id', topCategory)
    } else {
      query = query.eq('temperature', 'hot')
    }

    const { data, error } = await query

    // If error is about temperature field, retry without it
    if (error && (error.code === '42703' || error.message?.includes('temperature'))) {
      let fallbackQuery = supabase
        .from('offers')
        .select(`
          *,
          category:categories(id, name, slug, emoji)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (topCategory) {
        fallbackQuery = fallbackQuery.eq('category_id', topCategory)
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery
      
      if (fallbackError) {
        console.warn('⚠️ [getRecommendedOffers] Fallback também falhou, buscando ofertas simples...')
        let simpleQuery = supabase
          .from('offers')
          .select(`
            *,
            category:categories(id, name, slug, emoji)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (topCategory) {
          simpleQuery = simpleQuery.eq('category_id', topCategory)
        }
        
        const { data: simpleData, error: simpleError } = await simpleQuery
        if (simpleError) {
          console.error('❌ [getRecommendedOffers] Erro ao buscar ofertas simples:', simpleError)
          return []
        }
        
        return simpleData || []
      }
      
      return (fallbackData || []) as OfferWithCategory[]
    }

    if (error) {
      console.error('❌ [getRecommendedOffers] Erro ao buscar ofertas:', error)
      return []
    }

    return (data || []) as OfferWithCategory[]
  } catch (error) {
    console.error('❌ [getRecommendedOffers] Erro geral:', error)
    return []
  }
}

export async function getRecentSearches(limit = 5) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return []

    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching recent searches:', error)
    return []
  }
}



