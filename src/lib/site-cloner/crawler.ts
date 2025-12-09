/**
 * Crawler de Sites
 * Faz download de todos os assets de um site
 */

import * as cheerio from 'cheerio'
import { URL } from 'url'
import { validateUrl, validateSize } from './security'

export interface SiteAsset {
  url: string
  path: string
  type: 'html' | 'css' | 'js' | 'image' | 'font' | 'video' | 'other'
  content?: Buffer
  size: number
}

export interface CrawlResult {
  assets: SiteAsset[]
  totalSize: number
  baseUrl: string
  domain: string
}

const MAX_SIZE = 100 * 1024 * 1024 // 100 MB
const TIMEOUT = 40000 // 40 segundos

/**
 * Resolve uma URL relativa para absoluta
 */
function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href
  } catch {
    return relativeUrl
  }
}

/**
 * Determina o tipo de arquivo baseado na URL e content-type
 */
function getAssetType(url: string, contentType?: string): SiteAsset['type'] {
  const urlLower = url.toLowerCase()
  const ext = urlLower.split('.').pop()?.split('?')[0] || ''

  // Verificar por extensão primeiro
  if (['html', 'htm'].includes(ext)) return 'html'
  if (ext === 'css') return 'css'
  if (['js', 'mjs'].includes(ext)) return 'js'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext)) return 'image'
  if (['ttf', 'woff', 'woff2', 'otf', 'eot'].includes(ext)) return 'font'
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'

  // Verificar por content-type
  if (contentType) {
    if (contentType.includes('text/html')) return 'html'
    if (contentType.includes('text/css')) return 'css'
    if (contentType.includes('javascript')) return 'js'
    if (contentType.startsWith('image/')) return 'image'
    if (contentType.startsWith('font/') || contentType.includes('font')) return 'font'
    if (contentType.startsWith('video/')) return 'video'
  }

  return 'other'
}

/**
 * Baixa um arquivo com timeout
 */
async function downloadFile(url: string, timeout: number = TIMEOUT): Promise<{ buffer: Buffer; contentType?: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = response.headers.get('content-type') || undefined

    return { buffer, contentType }
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Timeout ao baixar arquivo')
    }
    throw error
  }
}

/**
 * Verifica se uma URL pertence ao mesmo domínio
 */
function isSameDomain(url: string, baseDomain: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === baseDomain || urlObj.hostname.endsWith('.' + baseDomain)
  } catch {
    return false
  }
}

/**
 * Faz crawling de um site e coleta todos os assets
 */
export async function crawlSite(targetUrl: string): Promise<CrawlResult> {
  // Validar URL
  const validation = validateUrl(targetUrl)
  if (!validation.valid) {
    throw new Error(validation.error || 'URL inválida')
  }

  const baseUrl = targetUrl
  const baseUrlObj = new URL(baseUrl)
  const domain = baseUrlObj.hostname

  const assets: SiteAsset[] = []
  const downloadedUrls = new Set<string>()
  let totalSize = 0

  // Função para adicionar asset sem duplicatas
  const addAsset = (url: string, path: string, type: SiteAsset['type'], content?: Buffer) => {
    const normalizedUrl = url.split('?')[0] // Remover query params para comparação

    if (downloadedUrls.has(normalizedUrl)) {
      return false
    }

    downloadedUrls.add(normalizedUrl)

    const size = content ? content.length : 0

    // Verificar tamanho total
    if (!validateSize(totalSize + size, MAX_SIZE)) {
      throw new Error(`Tamanho máximo excedido (${MAX_SIZE / 1024 / 1024}MB)`)
    }

    assets.push({
      url,
      path,
      type,
      content,
      size
    })

    totalSize += size
    return true
  }

  // 1. Baixar HTML principal
  console.log(`📥 Baixando HTML principal: ${baseUrl}`)
  const { buffer: htmlBuffer, contentType } = await downloadFile(baseUrl)
  const htmlPath = 'index.html'
  addAsset(baseUrl, htmlPath, 'html', htmlBuffer)

  // 2. Parsear HTML com Cheerio
  const $ = cheerio.load(htmlBuffer.toString('utf-8'))
  const baseHref = $('base').attr('href') || baseUrl

  // 3. Encontrar e baixar CSS
  const cssLinks: string[] = []
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      cssLinks.push(resolveUrl(baseHref, href))
    }
  })

  // 4. Encontrar e baixar JS
  const jsLinks: string[] = []
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src) {
      jsLinks.push(resolveUrl(baseHref, src))
    }
  })

  // 5. Encontrar e baixar imagens
  const imageLinks: string[] = []
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src) {
      imageLinks.push(resolveUrl(baseHref, src))
    }
  })

  // 6. Encontrar e baixar fontes (CSS pode ter @font-face)
  const fontLinks: string[] = []

  // 7. Baixar todos os assets encontrados
  const allLinks = [
    ...cssLinks.map(url => ({ url, type: 'css' as const })),
    ...jsLinks.map(url => ({ url, type: 'js' as const })),
    ...imageLinks.map(url => ({ url, type: 'image' as const })),
    ...fontLinks.map(url => ({ url, type: 'font' as const }))
  ]

  // Filtrar apenas URLs do mesmo domínio
  const sameDomainLinks = allLinks.filter(({ url }) => {
    try {
      return isSameDomain(url, domain)
    } catch {
      return false
    }
  })

  console.log(`📦 Encontrados ${sameDomainLinks.length} assets do mesmo domínio`)

  // Baixar assets em paralelo (com limite)
  const downloadPromises: Promise<void>[] = []
  let processedCount = 0

  for (const { url, type } of sameDomainLinks) {
    if (processedCount >= 50) break // Limite de 50 assets para não sobrecarregar

    const promise = downloadFile(url)
      .then(({ buffer, contentType }) => {
        const assetType = getAssetType(url, contentType)
        const relativePath = new URL(url).pathname || `assets/${url.split('/').pop()}`
        const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath

        addAsset(url, cleanPath, assetType, buffer)
        processedCount++
      })
      .catch((error) => {
        console.warn(`⚠️ Erro ao baixar ${url}:`, error.message)
      })

    downloadPromises.push(promise)

    // Processar em lotes de 10
    if (downloadPromises.length >= 10) {
      await Promise.all(downloadPromises)
      downloadPromises.length = 0
    }
  }

  // Aguardar downloads restantes
  await Promise.all(downloadPromises)

  // Processar CSS para encontrar fontes e imagens inline
  for (const asset of assets) {
    if (asset.type === 'css' && asset.content) {
      const cssContent = asset.content.toString('utf-8')
      
      // Encontrar @font-face e url()
      const urlMatches = cssContent.match(/url\(['"]?([^'")]+)['"]?\)/gi)
      if (urlMatches) {
        for (const match of urlMatches) {
          const urlMatch = match.match(/url\(['"]?([^'")]+)['"]?\)/i)
          if (urlMatch && urlMatch[1]) {
            const fontUrl = resolveUrl(asset.url, urlMatch[1])
            if (isSameDomain(fontUrl, domain) && !downloadedUrls.has(fontUrl.split('?')[0])) {
              try {
                const { buffer } = await downloadFile(fontUrl)
                const fontType = getAssetType(fontUrl)
                const relativePath = new URL(fontUrl).pathname || `assets/${fontUrl.split('/').pop()}`
                const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
                addAsset(fontUrl, cleanPath, fontType, buffer)
              } catch (error: any) {
                console.warn(`⚠️ Erro ao baixar fonte ${fontUrl}:`, error.message)
              }
            }
          }
        }
      }
    }
  }

  console.log(`✅ Crawling completo: ${assets.length} assets, ${(totalSize / 1024 / 1024).toFixed(2)} MB`)

  return {
    assets,
    totalSize,
    baseUrl,
    domain
  }
}

