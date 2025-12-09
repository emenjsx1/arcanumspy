/**
 * Busca e parseia robots.txt
 */

export interface RobotsInfo {
  found: boolean
  content: string
  blocked_paths: string[]
  sitemaps: string[]
  userAgents: string[]
}

export async function getRobots(domain: string, timeout: number = 10000): Promise<RobotsInfo> {
  // Normalizar domínio
  let normalizedDomain = domain.trim()
  if (!normalizedDomain.startsWith('http://') && !normalizedDomain.startsWith('https://')) {
    normalizedDomain = `https://${normalizedDomain}`
  }

  const baseUrl = new URL(normalizedDomain)
  const robotsUrl = `${baseUrl.protocol}//${baseUrl.host}/robots.txt`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(robotsUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      clearTimeout(timeoutId)

      if (response.status === 200) {
        const content = await response.text()
        const parsed = parseRobots(content)
        
        return {
          found: true,
          content,
          blocked_paths: parsed.blockedPaths,
          sitemaps: parsed.sitemaps,
          userAgents: parsed.userAgents
        }
      }

      return {
        found: false,
        content: '',
        blocked_paths: [],
        sitemaps: [],
        userAgents: []
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return {
          found: false,
          content: '',
          blocked_paths: [],
          sitemaps: [],
          userAgents: []
        }
      }
      
      throw fetchError
    }
  } catch (error) {
    return {
      found: false,
      content: '',
      blocked_paths: [],
      sitemaps: [],
      userAgents: []
    }
  }
}

function parseRobots(content: string): {
  blockedPaths: string[]
  sitemaps: string[]
  userAgents: string[]
} {
  const lines = content.split('\n').map(line => line.trim())
  const blockedPaths: string[] = []
  const sitemaps: string[] = []
  const userAgents: string[] = []
  let currentUserAgent = '*'

  for (const line of lines) {
    // Ignorar comentários e linhas vazias
    if (!line || line.startsWith('#')) {
      continue
    }

    // User-agent
    const userAgentMatch = line.match(/^User-agent:\s*(.+)$/i)
    if (userAgentMatch) {
      currentUserAgent = userAgentMatch[1].trim()
      if (!userAgents.includes(currentUserAgent)) {
        userAgents.push(currentUserAgent)
      }
      continue
    }

    // Disallow
    const disallowMatch = line.match(/^Disallow:\s*(.+)$/i)
    if (disallowMatch) {
      const path = disallowMatch[1].trim()
      if (path && path !== '/') {
        blockedPaths.push(path)
      }
      continue
    }

    // Sitemap
    const sitemapMatch = line.match(/^Sitemap:\s*(.+)$/i)
    if (sitemapMatch) {
      const sitemapUrl = sitemapMatch[1].trim()
      if (sitemapUrl && !sitemaps.includes(sitemapUrl)) {
        sitemaps.push(sitemapUrl)
      }
      continue
    }
  }

  // Remover duplicatas
  return {
    blockedPaths: Array.from(new Set(blockedPaths)),
    sitemaps: Array.from(new Set(sitemaps)),
    userAgents: Array.from(new Set(userAgents))
  }
}




