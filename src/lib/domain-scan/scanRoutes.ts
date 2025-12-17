/**
 * Testa diretórios sensíveis comuns
 */

export interface SensitiveRoute {
  path: string
  status: number
  accessible: boolean
  type: 'admin' | 'login' | 'api' | 'config' | 'backup' | 'other'
}

const SENSITIVE_ROUTES = [
  { path: '/admin', type: 'admin' as const },
  { path: '/admin/login', type: 'admin' as const },
  { path: '/wp-admin', type: 'admin' as const },
  { path: '/wp-login.php', type: 'admin' as const },
  { path: '/login', type: 'login' as const },
  { path: '/signin', type: 'login' as const },
  { path: '/dashboard', type: 'admin' as const },
  { path: '/api', type: 'api' as const },
  { path: '/api/v1', type: 'api' as const },
  { path: '/api/v2', type: 'api' as const },
  { path: '/config', type: 'config' as const },
  { path: '/config.php', type: 'config' as const },
  { path: '/configuration', type: 'config' as const },
  { path: '/backup', type: 'backup' as const },
  { path: '/backups', type: 'backup' as const },
  { path: '/test', type: 'other' as const },
  { path: '/dev', type: 'other' as const },
  { path: '/staging', type: 'other' as const },
  { path: '/.env', type: 'config' as const },
  { path: '/.git', type: 'config' as const },
  { path: '/phpinfo.php', type: 'config' as const },
  { path: '/.htaccess', type: 'config' as const },
  { path: '/web.config', type: 'config' as const },
]

export async function scanRoutes(
  baseDomain: string,
  timeout: number = 10000
): Promise<SensitiveRoute[]> {
  // Normalizar domínio
  let normalizedDomain = baseDomain.trim()
  if (!normalizedDomain.startsWith('http://') && !normalizedDomain.startsWith('https://')) {
    normalizedDomain = `https://${normalizedDomain}`
  }

  const baseUrl = new URL(normalizedDomain)
  const results: SensitiveRoute[] = []

  // Testar rotas em paralelo (batches de 5 para não sobrecarregar)
  const batchSize = 5
  for (let i = 0; i < SENSITIVE_ROUTES.length; i += batchSize) {
    const batch = SENSITIVE_ROUTES.slice(i, i + batchSize)
    
    const batchResults = await Promise.all(
      batch.map(async (route) => {
        const fullUrl = `${baseUrl.protocol}//${baseUrl.host}${route.path}`
        const result = await checkRoute(fullUrl, route.path, route.type, timeout)
        return result
      })
    )

    results.push(...batchResults.filter(r => r !== null) as SensitiveRoute[])

    // Pequeno delay entre batches
    if (i + batchSize < SENSITIVE_ROUTES.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return results
}

async function checkRoute(
  url: string,
  path: string,
  type: SensitiveRoute['type'],
  timeout: number
): Promise<SensitiveRoute | null> {
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
        path,
        status,
        accessible,
        type
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return null // Timeout - não adicionar aos resultados
      }
      
      // Erro de conexão - considerar inacessível
      return {
        path,
        status: 0,
        accessible: false,
        type
      }
    }
  } catch (error) {
    return null
  }
}










