import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { OfferWithCategory } from './offers-server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

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

export interface DashboardStats {
  offersViewed: number // Este mês
  offersViewedTotal: number // Total
  favoritesCount: number
  categoriesAccessed: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        offersViewed: 0,
        offersViewedTotal: 0,
        favoritesCount: 0,
        categoriesAccessed: 0,
      }
    }

    // Get offers viewed this month (usando user_activities se disponível)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let viewsCount = 0
    let viewsCountTotal = 0

    // Tentar buscar de user_activities primeiro (mais preciso)
    // Usar adminClient para evitar problemas de RLS
    try {
      // Verificar se a chave de serviço está configurada antes de tentar usar adminClient
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
      }
      
      const adminClient = createAdminClient()
      
      // OTIMIZAÇÃO: Timeout de 3 segundos para evitar travamento
      const statsPromise = Promise.all([
        adminClient
          .from('user_activities')
          .select('offer_id')
          .eq('user_id', user.id)
          .eq('type', 'OFFER_VIEW')
          .gte('created_at', startOfMonth.toISOString()),
        adminClient
          .from('user_activities')
          .select('offer_id')
          .eq('user_id', user.id)
          .eq('type', 'OFFER_VIEW')
      ])

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao buscar estatísticas')), 3000)
      )

      const [initialActivitiesThisMonthResult, initialActivitiesTotalResult] = await Promise.race([
        statsPromise,
        timeoutPromise
      ]) as any[]

      const { data: initialActivitiesThisMonth, error: activitiesError } = initialActivitiesThisMonthResult
      const { data: initialActivitiesTotal, error: activitiesTotalError } = initialActivitiesTotalResult

      if (!activitiesError && initialActivitiesThisMonth) {
        const uniqueOffersThisMonth = new Set(initialActivitiesThisMonth.map((a: any) => a.offer_id).filter(Boolean))
        viewsCount = uniqueOffersThisMonth.size
      }

      if (!activitiesTotalError && initialActivitiesTotal) {
        const uniqueOffersTotal = new Set(initialActivitiesTotal.map((a: any) => a.offer_id).filter(Boolean))
        viewsCountTotal = uniqueOffersTotal.size
      }
    } catch (error) {
      // Se user_activities não existir ou houver qualquer erro, usar offer_views como fallback
      try {
        // Este mês
        const { data: viewsThisMonth } = await supabase
          .from('offer_views')
          .select('offer_id')
          .eq('user_id', user.id)
          .gte('viewed_at', startOfMonth.toISOString())
        
        if (viewsThisMonth) {
          const uniqueOffersThisMonth = new Set(viewsThisMonth.map((v: any) => v.offer_id).filter(Boolean))
          viewsCount = uniqueOffersThisMonth.size
        }

        // Total
        const { data: viewsTotal } = await supabase
          .from('offer_views')
          .select('offer_id')
          .eq('user_id', user.id)
        
        if (viewsTotal) {
          const uniqueOffersTotal = new Set(viewsTotal.map((v: any) => v.offer_id).filter(Boolean))
          viewsCountTotal = uniqueOffersTotal.size
        }
      } catch (fallbackError) {
        console.warn('⚠️ [getDashboardStats] Erro ao buscar visualizações:', fallbackError)
      }
    }

    // Get favorites count com timeout
    let favoritesCount = 0
    try {
      const favoritesPromise = supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      const favoritesTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )
      
      const { count } = await Promise.race([favoritesPromise, favoritesTimeout]) as any
      favoritesCount = count || 0
    } catch (error) {
      console.warn('⚠️ [getDashboardStats] Erro ao buscar favoritos:', error)
    }

    // Get unique categories accessed com timeout
    let uniqueCategories = new Set<string>()
    try {
      const categoriesPromise = supabase
        .from('offer_views')
        .select('offer:offers(category_id)')
        .eq('user_id', user.id)
        .limit(100) // Limitar para evitar query muito lenta
      
      const categoriesTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )
      
      const { data: viewedOffers } = await Promise.race([categoriesPromise, categoriesTimeout]) as any
      
      uniqueCategories = new Set(
        viewedOffers?.map((v: any) => v.offer?.category_id).filter(Boolean) || []
      )
    } catch (error) {
      console.warn('⚠️ [getDashboardStats] Erro ao buscar categorias:', error)
    }

    return {
      offersViewed: viewsCount,
      offersViewedTotal: viewsCountTotal,
      favoritesCount: favoritesCount || 0,
      categoriesAccessed: uniqueCategories.size,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      offersViewed: 0,
      offersViewedTotal: 0,
      favoritesCount: 0,
      categoriesAccessed: 0,
    }
  }
}

export interface RecentActivity {
  id: string
  activity_type: string
  activity_data: any
  created_at: string
  offer?: {
    title?: string
    id?: string
  }
}

export async function getRecentActivities(limit = 10): Promise<RecentActivity[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return []

    // OTIMIZAÇÃO: Timeout de 3 segundos para evitar travamento
    const timeoutPromise = new Promise<RecentActivity[]>((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ [getRecentActivities] Timeout, usando fallback')
        resolve([])
      }, 3000)
    })

    const activitiesPromise = (async () => {
      // Buscar atividades recentes da tabela user_activities
      // Usar adminClient para evitar problemas de RLS
      let activities: any[] = []
      try {
        // Verificar se a chave de serviço está configurada
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
        }
        
        const adminClient = createAdminClient()
        const { data, error: activitiesError } = await adminClient
          .from('user_activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (activitiesError) {
          console.warn('⚠️ [getRecentActivities] Erro ao buscar user_activities:', activitiesError.message || activitiesError.code, '- usando fallback')
          return await getRecentActivitiesFromOtherSources(supabase, user.id, limit)
        }

        activities = data || []
      } catch (error: any) {
        // Se houver qualquer erro (incluindo 500), buscar de outras fontes
        console.warn('⚠️ [getRecentActivities] Exceção ao buscar user_activities:', error?.message || error, '- usando fallback')
        return await getRecentActivitiesFromOtherSources(supabase, user.id, limit)
      }

      if (!activities || activities.length === 0) {
        // Se não houver atividades, buscar de outras fontes (favoritos, visualizações, etc)
        return await getRecentActivitiesFromOtherSources(supabase, user.id, limit)
      }

      // OTIMIZAÇÃO: Buscar todas as ofertas de uma vez em vez de uma por uma
      const offerIds = (activities || [])
        .map(activity => {
          const activityType = activity.type || activity.activity_type
          if (activityType === 'OFFER_VIEW' || activityType === 'offer_viewed') {
            return activity.offer_id || activity.activity_data?.offer_id
          }
          return null
        })
        .filter(Boolean) as string[]
      
      let offersMap: Record<string, { id: string; title: string }> = {}
      if (offerIds.length > 0) {
        const { data: offers } = await supabase
          .from('offers')
          .select('id, title')
          .in('id', offerIds)
        
        if (offers) {
          offersMap = offers.reduce((acc: Record<string, { id: string; title: string }>, offer: { id: string; title: string }) => {
            acc[offer.id] = offer
            return acc
          }, {} as Record<string, { id: string; title: string }>)
        }
      }
      
      // Enriquecer atividades com dados das ofertas
      const enrichedActivities = (activities || []).map((activity) => {
        const activityType = activity.type || activity.activity_type
        const offerId = activity.offer_id || activity.activity_data?.offer_id
        
        return {
          ...activity,
          activity_type: activityType,
          offer: offerId ? offersMap[offerId] : undefined,
        }
      })

      return enrichedActivities as RecentActivity[]
    })()

    // Usar Promise.race para timeout
    return await Promise.race([activitiesPromise, timeoutPromise])
  } catch (error) {
    console.error('Error in getRecentActivities:', error)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    return await getRecentActivitiesFromOtherSources(supabase, user.id, limit)
  }
}

async function getRecentActivitiesFromOtherSources(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number
): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = []

    // Buscar favoritos recentes
    const { data: recentFavorites } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        offer:offers(id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Math.floor(limit / 2))

    if (recentFavorites) {
      recentFavorites.forEach((fav: any) => {
        activities.push({
          id: fav.id,
          activity_type: 'favorite_added',
          activity_data: { offer_id: fav.offer?.id },
          created_at: fav.created_at,
          offer: fav.offer,
        })
      })
    }

    // Buscar visualizações recentes
    const { data: recentViews } = await supabase
      .from('offer_views')
      .select(`
        id,
        viewed_at,
        offer:offers(id, title)
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(Math.floor(limit / 2))

    if (recentViews) {
      recentViews.forEach((view: any) => {
        activities.push({
          id: view.id,
          activity_type: 'offer_viewed',
          activity_data: { offer_id: view.offer?.id },
          created_at: view.viewed_at,
          offer: view.offer,
        })
      })
    }

    // Ordenar por data e limitar
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  } catch (error) {
    return []
  }
}



