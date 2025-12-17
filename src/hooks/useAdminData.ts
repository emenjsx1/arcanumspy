/**
 * Hooks específicos para dados admin
 * 
 * Centraliza lógica de busca de dados admin
 * Usa autenticação e tratamento de erro consistentes
 */

import { useDataLoader } from './useDataLoader'
import { useSWRData } from './useSWRData'
import type { OfferWithRelations } from '@/types/api'

/**
 * Hook para buscar ofertas admin
 */
export function useAdminOffers() {
  return useSWRData<{ offers: OfferWithRelations[] }>('/api/admin/offers')
}

/**
 * Hook para buscar usuários admin
 */
export function useAdminUsers() {
  return useSWRData<{ users: any[] }>('/api/admin/users')
}

/**
 * Hook para buscar estatísticas admin
 */
export function useAdminStats() {
  return useDataLoader<{ stats: any }>({
    fetcher: async () => {
      const { data: { session } } = await (await import('@/lib/supabase/client')).supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Não autenticado')
      }

      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`)
      }

      return response.json()
    },
  })
}







