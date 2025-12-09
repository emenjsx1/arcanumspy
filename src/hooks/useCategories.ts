/**
 * Hook otimizado para buscar categorias com SWR
 */

import useSWR from 'swr'
import { fetcher } from '@/lib/swr-config'
import type { Category } from '@/lib/types'

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<{ categories: Category[] }>(
    '/api/categories',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutos (categorias mudam raramente)
    }
  )

  return {
    categories: data?.categories || [],
    isLoading,
    error,
    mutate,
  }
}




