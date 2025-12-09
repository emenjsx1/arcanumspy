/**
 * Extrai URLs internas do HTML
 */

export interface ExtractedLink {
  url: string
  text?: string
  type: 'link' | 'script' | 'style' | 'image' | 'form'
}

export function extractLinks(html: string, baseDomain: string): ExtractedLink[] {
  const links: ExtractedLink[] = []
  
  // Normalizar baseDomain
  let normalizedBase = baseDomain.trim()
  if (!normalizedBase.startsWith('http://') && !normalizedBase.startsWith('https://')) {
    normalizedBase = `https://${normalizedBase}`
  }
  
  const baseUrl = new URL(normalizedBase)
  const domain = baseUrl.hostname

  // Extrair links <a href="...">
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const text = match[2]?.replace(/<[^>]+>/g, '').trim()
    const fullUrl = resolveUrl(href, baseUrl)
    if (fullUrl && isInternalUrl(fullUrl, domain)) {
      links.push({ url: fullUrl, text, type: 'link' })
    }
  }

  // Extrair scripts <script src="...">
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi
  while ((match = scriptRegex.exec(html)) !== null) {
    const src = match[1]
    const fullUrl = resolveUrl(src, baseUrl)
    if (fullUrl && isInternalUrl(fullUrl, domain)) {
      links.push({ url: fullUrl, type: 'script' })
    }
  }

  // Extrair stylesheets <link rel="stylesheet" href="...">
  const styleRegex = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi
  while ((match = styleRegex.exec(html)) !== null) {
    const href = match[1]
    const fullUrl = resolveUrl(href, baseUrl)
    if (fullUrl && isInternalUrl(fullUrl, domain)) {
      links.push({ url: fullUrl, type: 'style' })
    }
  }

  // Extrair imagens <img src="...">
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    const fullUrl = resolveUrl(src, baseUrl)
    if (fullUrl && isInternalUrl(fullUrl, domain)) {
      links.push({ url: fullUrl, type: 'image' })
    }
  }

  // Extrair forms <form action="...">
  const formRegex = /<form[^>]+action=["']([^"']+)["'][^>]*>/gi
  while ((match = formRegex.exec(html)) !== null) {
    const action = match[1]
    const fullUrl = resolveUrl(action, baseUrl)
    if (fullUrl && isInternalUrl(fullUrl, domain)) {
      links.push({ url: fullUrl, type: 'form' })
    }
  }

  // Remover duplicatas
  const uniqueLinks = Array.from(
    new Map(links.map(link => [link.url, link])).values()
  )

  return uniqueLinks
}

function resolveUrl(url: string, baseUrl: URL): string | null {
  try {
    // URLs absolutas
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    // URLs relativas
    if (url.startsWith('/')) {
      return `${baseUrl.protocol}//${baseUrl.host}${url}`
    }

    // URLs relativas sem barra
    if (url.startsWith('./') || !url.startsWith('#')) {
      const resolved = new URL(url, baseUrl.toString())
      return resolved.toString()
    }

    return null
  } catch {
    return null
  }
}

function isInternalUrl(url: string, domain: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
  } catch {
    return false
  }
}

