/**
 * Hook otimizado para buscar ofertas com SWR
 */

import useSWR from 'swr'
import { fetcher, createCacheKey } from '@/lib/swr-config'
import type { Offer } from '@/lib/types'

interface UseOffersOptions {
  filters?: {
    category_id?: string
    niche_id?: string
    search?: string
    product_type?: string
  }
  enabled?: boolean
}

export function useOffers(options: UseOffersOptions = {}) {
  const { filters = {}, enabled = true } = options

  const cacheKey = enabled ? createCacheKey('/api/offers', filters) : null

  const { data, error, isLoading, mutate } = useSWR<{ offers: Offer[] }>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000, // 5 segundos
    }
  )

  return {
    offers: data?.offers || [],
    isLoading,
    error,
    mutate,
  }
}




