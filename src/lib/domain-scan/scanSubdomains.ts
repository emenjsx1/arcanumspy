/**
 * Testa subdomínios comuns
 */

export interface SubdomainResult {
  subdomain: string
  url: string
  status: number
  accessible: boolean
}

const COMMON_SUBDOMAINS = [
  'www',
  'app',
  'api',
  'admin',
  'blog',
  'dev',
  'staging',
  'test',
  'mail',
  'ftp',
  'cdn',
  'static',
  'assets',
  'media',
  'shop',
  'store',
  'support',
  'help',
  'docs',
  'portal'
]

export async function scanSubdomains(
  domain: string,
  timeout: number = 10000
): Promise<SubdomainResult[]> {
  // Normalizar domínio (remover protocolo e path)
  let cleanDomain = domain.trim()
  if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '')
  }
  cleanDomain = cleanDomain.split('/')[0] // Remover path se houver

  const results: SubdomainResult[] = []

  // Testar subdomínios em paralelo (batches de 5)
  const batchSize = 5
  for (let i = 0; i < COMMON_SUBDOMAINS.length; i += batchSize) {
    const batch = COMMON_SUBDOMAINS.slice(i, i + batchSize)
    
    const batchResults = await Promise.all(
      batch.map(async (subdomain) => {
        const subdomainUrl = `https://${subdomain}.${cleanDomain}`
        const result = await checkSubdomain(subdomainUrl, subdomain, timeout)
        return result
      })
    )

    results.push(...batchResults.filter(r => r !== null) as SubdomainResult[])

    // Pequeno delay entre batches
    if (i + batchSize < COMMON_SUBDOMAINS.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return results
}

async function checkSubdomain(
  url: string,
  subdomain: string,
  timeout: number
): Promise<SubdomainResult | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      clearTimeout(timeoutId)

      const status = response.status
      const accessible = status >= 200 && status < 400

      return {
        subdomain,
        url,
        status,
        accessible
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return null // Timeout - não adicionar aos resultados
      }
      
      // Erro de conexão (subdomínio não existe ou inacessível)
      return null
    }
  } catch (error) {
    return null
  }
}




