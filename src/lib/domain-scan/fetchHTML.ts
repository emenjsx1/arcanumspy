/**
 * Busca HTML e headers de uma URL com timeout de 10s
 */

export interface FetchResult {
  html: string
  headers: Record<string, string>
  status: number
  url: string
}

export async function fetchHTML(url: string, timeout: number = 10000): Promise<FetchResult | null> {
  try {
    // Normalizar URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(normalizedUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })

      clearTimeout(timeoutId)

      const html = await response.text()
      
      // Converter headers para objeto simples
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value
      })

      return {
        html,
        headers,
        status: response.status,
        url: response.url || normalizedUrl
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return null // Timeout
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error(`Erro ao buscar HTML de ${url}:`, error.message)
    return null
  }
}










