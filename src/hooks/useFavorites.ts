/**
 * Hook otimizado para buscar favoritos com SWR
 */

import useSWR from 'swr'
import { fetcher } from '@/lib/swr-config'
import { useAuthData } from './useAuthData'

export function useFavorites() {
  const { userId, isAuthenticated } = useAuthData()

  const { data, error, isLoading, mutate } = useSWR<{ favorites: string[] }>(
    isAuthenticated && userId ? `/api/favorites?user_id=${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
    }
  )

  const favoritesSet = new Set<string>(data?.favorites || [])

  return {
    favorites: favoritesSet,
    isLoading,
    error,
    mutate,
    isFavorite: (offerId: string) => favoritesSet.has(offerId),
  }
}










