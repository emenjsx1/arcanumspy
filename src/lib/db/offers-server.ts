import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

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
  }
}

export async function getHotOffers(limit = 10): Promise<OfferWithCategory[]> {
  try {
    const supabase = await createClient()
    
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
        
        return (fallbackData || []) as OfferWithCategory[]
      }
      throw error
    }

    return (data || []) as OfferWithCategory[]
  } catch (error) {
    console.error('❌ [getHotOffers] Erro ao buscar ofertas quentes:', error)
    return []
  }
}

export async function getNewOffers(limit = 10, days = 7): Promise<OfferWithCategory[]> {
  try {
    const supabase = await createClient()
    
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - days)
    dateLimit.setHours(0, 0, 0, 0)

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

    return (data || []) as OfferWithCategory[]
  } catch (error) {
    console.error('❌ [getNewOffers] Erro ao buscar ofertas novas:', error)
    return []
  }
}

export async function getScaledOffers(limit = 10): Promise<OfferWithCategory[]> {
  try {
    const supabase = await createClient()
    
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

    return (data || []) as OfferWithCategory[]
  } catch (error) {
    console.error('❌ [getScaledOffers] Erro ao buscar ofertas escalando:', error)
    return []
  }
}



