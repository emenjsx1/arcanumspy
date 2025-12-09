/**
 * Configuração global do SWR para cache de API calls
 */

export const swrConfig = {
  // Revalidar dados a cada 5 minutos
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0, // Desabilitar auto-refresh (usar manual quando necessário)
  dedupingInterval: 2000, // Deduplicar requisições dentro de 2s
  focusThrottleInterval: 5000, // Throttle de 5s ao focar na janela
  errorRetryCount: 2, // Tentar apenas 2 vezes em caso de erro
  errorRetryInterval: 5000, // Aguardar 5s entre tentativas
  shouldRetryOnError: (error: any) => {
    // Não tentar novamente em erros 4xx (client errors)
    return error?.status >= 500
  },
  // Cache provider (usar localStorage em produção)
  provider: typeof window !== 'undefined' ? () => new Map() : undefined,
}

// Fetcher padrão com timeout e autenticação
export const fetcher = async (url: string, options?: RequestInit) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    // Obter token do Supabase se disponível
    let authToken: string | undefined
    if (typeof window !== 'undefined') {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data: { session } } = await supabase.auth.getSession()
        authToken = session?.access_token
      } catch (e) {
        // Ignorar erro se não conseguir obter token
      }
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        ...options?.headers,
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error: any = new Error('An error occurred while fetching the data.')
      error.status = response.status
      error.info = await response.json().catch(() => ({}))
      throw error
    }

    return response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      const timeoutError: any = new Error('Request timeout')
      timeoutError.status = 408
      throw timeoutError
    }
    throw error
  }
}

// Helper para criar key de cache
export const createCacheKey = (endpoint: string, params?: Record<string, any>) => {
  if (!params) return endpoint
  const queryString = new URLSearchParams(params).toString()
  return `${endpoint}?${queryString}`
}




