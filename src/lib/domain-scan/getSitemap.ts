/**
 * Busca sitemap.xml e extrai URLs
 */

export interface SitemapInfo {
  found: boolean
  urls: string[]
  sitemapUrl?: string
}

export async function getSitemap(domain: string, timeout: number = 10000): Promise<SitemapInfo> {
  // Normalizar domínio
  let normalizedDomain = domain.trim()
  if (!normalizedDomain.startsWith('http://') && !normalizedDomain.startsWith('https://')) {
    normalizedDomain = `https://${normalizedDomain}`
  }

  const baseUrl = new URL(normalizedDomain)
  const sitemapUrl = `${baseUrl.protocol}//${baseUrl.host}/sitemap.xml`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(sitemapUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      clearTimeout(timeoutId)

      if (response.status === 200) {
        const content = await response.text()
        const urls = extractUrlsFromSitemap(content)
        
        return {
          found: true,
          urls,
          sitemapUrl
        }
      }

      return {
        found: false,
        urls: []
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return {
          found: false,
          urls: []
        }
      }
      
      throw fetchError
    }
  } catch (error) {
    return {
      found: false,
      urls: []
    }
  }
}

function extractUrlsFromSitemap(content: string): string[] {
  const urls: string[] = []

  // Formato XML sitemap padrão
  const urlRegex = /<loc>(.*?)<\/loc>/gi
  let match
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[1].trim()
    if (url) {
      urls.push(url)
    }
  }

  // Formato de índice de sitemaps (sitemapindex)
  const sitemapRegex = /<sitemap>\s*<loc>(.*?)<\/loc>/gi
  while ((match = sitemapRegex.exec(content)) !== null) {
    const sitemapUrl = match[1].trim()
    if (sitemapUrl) {
      urls.push(sitemapUrl)
    }
  }

  // Formato texto simples (um URL por linha)
  if (urls.length === 0) {
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
        urls.push(trimmed)
      }
    }
  }

  return Array.from(new Set(urls)) // Remover duplicatas
}










