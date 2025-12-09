import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { OfferWithCategory } from '@/lib/db/offers'

type Offer = Database['public']['Tables']['offers']['Row']

export interface OfferWithViews extends OfferWithCategory {
  views_count?: number
}

export async function getTopOffers(limit = 10): Promise<OfferWithViews[]> {
  const startTime = Date.now()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.warn('⚠️ [Admin Top Offers] Sem sessão')
      return []
    }

    const response = await fetch(`/api/admin/offers?top=${limit}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const offers = (data.offers || []).slice(0, limit) as OfferWithViews[]

    const totalTime = Date.now() - startTime

    return offers
  } catch (error) {
    console.error('❌ [Admin Top Offers] Erro ao buscar ofertas:', error)
    return []
  }
}

