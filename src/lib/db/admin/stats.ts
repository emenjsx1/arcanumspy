import { supabase } from '@/lib/supabase/client'

export interface AdminStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalOffers: number
  activeOffers: number
  totalViews: number
  totalCreditsLoaded: number // Total de créditos carregados
  totalCreditsConsumed: number // Total de créditos consumidos
}

/**
 * Buscar estatísticas do admin via API route (server-side)
 * Esta função chama a API route que usa adminClient
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.warn('⚠️ [Admin Stats] Sem sessão')
      throw new Error('Não autenticado')
    }

    const response = await fetch('/api/admin/stats', {
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
    return data.stats || {
      totalUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
      totalOffers: 0,
      activeOffers: 0,
      totalViews: 0,
      totalCreditsLoaded: 0,
      totalCreditsConsumed: 0,
    }
  } catch (error: any) {
    console.error('❌ [Admin Stats] Erro ao buscar estatísticas:', error)
    return {
      totalUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
      totalOffers: 0,
      activeOffers: 0,
      totalViews: 0,
      totalCreditsLoaded: 0,
      totalCreditsConsumed: 0,
    }
  }
}

