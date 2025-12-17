/**
 * Hook genérico para carregar dados de forma estável
 * 
 * Resolve problemas de dependências infinitas em useEffect
 * Elimina necessidade de useCallback manual
 * 
 * @example
 * const { data, loading, error, reload } = useDataLoader({
 *   fetcher: async () => {
 *     const response = await fetch('/api/data')
 *     return response.json()
 *   }
 * })
 */
import { useState, useEffect, useCallback } from 'react'

export interface UseDataLoaderOptions<T> {
  fetcher: () => Promise<T>
  enabled?: boolean
  onError?: (error: Error) => void
  onSuccess?: (data: T) => void
}

export interface UseDataLoaderResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  reload: () => Promise<void>
}

export function useDataLoader<T>(options: UseDataLoaderOptions<T>): UseDataLoaderResult<T> {
  const { fetcher, enabled = true, onError, onSuccess } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetcher estável - só muda se a função fetcher mudar
  const stableFetcher = useCallback(fetcher, [fetcher])

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const result = await stableFetcher()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [stableFetcher, enabled, onError, onSuccess])

  useEffect(() => {
    load()
  }, [load])

  return { 
    data, 
    loading, 
    error, 
    reload: load 
  }
}







