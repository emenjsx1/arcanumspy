/**
 * Hook genérico para dados com SWR (cache automático)
 * 
 * Usa SWR para cache e revalidação automática
 * Ideal para dados que mudam frequentemente
 * 
 * @example
 * const { data, loading, error, mutate } = useSWRData<Offer[]>('/api/offers')
 */
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-config'

export interface UseSWRDataOptions {
  enabled?: boolean
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  dedupingInterval?: number
}

export interface UseSWRDataResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  mutate: (data?: T, shouldRevalidate?: boolean) => Promise<T | undefined>
}

export function useSWRData<T>(
  key: string | null,
  options?: UseSWRDataOptions
): UseSWRDataResult<T> {
  const {
    enabled = true,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    dedupingInterval = 5000,
  } = options || {}
  
  const { data, error, isLoading, mutate } = useSWR<T>(
    enabled && key ? key : null,
    fetcher,
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      dedupingInterval,
    }
  )

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    mutate: async (newData?: T, shouldRevalidate = true) => {
      return mutate(newData, shouldRevalidate)
    },
  }
}







