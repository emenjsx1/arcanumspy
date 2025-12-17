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
  let htmlBuffer: Buffer
  try {
    const result = await downloadFile(baseUrl)
    htmlBuffer = result.buffer
    if (!htmlBuffer || htmlBuffer.length === 0) {
      throw new Error('HTML principal está vazio')
    }
    console.log(`✅ HTML baixado: ${htmlBuffer.length} bytes`)
  } catch (error: any) {
    console.error(`❌ Erro ao baixar HTML principal:`, error)
    throw new Error(`Não foi possível baixar o HTML principal: ${error.message}`)
  }
  
  const htmlPath = 'index.html'
  if (!addAsset(baseUrl, htmlPath, 'html', htmlBuffer)) {
    throw new Error('Erro ao adicionar HTML principal aos assets')
  }
  console.log(`✅ HTML principal adicionado aos assets`)

  // 2. Parsear HTML com Cheerio
  let $: cheerio.CheerioAPI
  try {
    const htmlContent = htmlBuffer.toString('utf-8')
    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('HTML está vazio após parsing')
    }
    $ = cheerio.load(htmlContent)
    console.log(`✅ HTML parseado com sucesso`)
  } catch (error: any) {
    console.error(`❌ Erro ao parsear HTML:`, error)
    throw new Error(`Erro ao processar HTML: ${error.message}`)
  }
  
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

  console.log(`📋 Total de links encontrados: ${allLinks.length} (CSS: ${cssLinks.length}, JS: ${jsLinks.length}, Imagens: ${imageLinks.length})`)

  // Filtrar apenas URLs do mesmo domínio (mas ser mais flexível)
  const sameDomainLinks = allLinks.filter(({ url }) => {
    try {
      const urlObj = new URL(url)
      // Aceitar mesmo domínio ou subdomínios
      return urlObj.hostname === domain || 
             urlObj.hostname.endsWith('.' + domain) ||
             domain.endsWith('.' + urlObj.hostname)
    } catch {
      return false
    }
  })

  console.log(`📦 Encontrados ${sameDomainLinks.length} assets do mesmo domínio (de ${allLinks.length} total)`)

  // Baixar assets em paralelo (com limite maior)
  const downloadPromises: Promise<void>[] = []
  let processedCount = 0
  const MAX_ASSETS = 100 // Aumentado de 50 para 100

  for (const { url, type } of sameDomainLinks) {
    if (processedCount >= MAX_ASSETS) {
      console.log(`⚠️ Limite de ${MAX_ASSETS} assets atingido`)
      break
    }

    const promise = downloadFile(url)
      .then(({ buffer, contentType }) => {
        if (!buffer || buffer.length === 0) {
          console.warn(`⚠️ Arquivo vazio: ${url}`)
          return
        }
        
        const assetType = getAssetType(url, contentType)
        const urlObj = new URL(url)
        let relativePath = urlObj.pathname
        
        // Se não tiver pathname, usar o nome do arquivo
        if (!relativePath || relativePath === '/') {
          const fileName = url.split('/').pop()?.split('?')[0] || 'file'
          relativePath = `assets/${fileName}`
        } else {
          // Remover barra inicial e criar estrutura de pastas
          relativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
          // Garantir que não seja vazio
          if (!relativePath) {
            relativePath = `assets/${url.split('/').pop()?.split('?')[0] || 'file'}`
          }
        }

        const added = addAsset(url, relativePath, assetType, buffer)
        if (added) {
          processedCount++
          console.log(`✅ Baixado: ${relativePath} (${(buffer.length / 1024).toFixed(2)} KB)`)
        }
      })
      .catch((error) => {
        console.warn(`⚠️ Erro ao baixar ${url}:`, error.message)
      })

    downloadPromises.push(promise)

    // Processar em lotes de 5 para não sobrecarregar
    if (downloadPromises.length >= 5) {
      await Promise.allSettled(downloadPromises)
      downloadPromises.length = 0
    }
  }

  // Aguardar downloads restantes
  if (downloadPromises.length > 0) {
    await Promise.allSettled(downloadPromises)
  }
  
  console.log(`✅ Downloads concluídos: ${processedCount} arquivos baixados`)

  // Processar CSS para encontrar fontes e imagens inline
  for (const asset of assets) {
    if (asset.type === 'css' && asset.content && asset.content.length > 0) {
      try {
        const cssContent = asset.content.toString('utf-8')
        
        // Encontrar @font-face e url()
        const urlMatches = cssContent.match(/url\(['"]?([^'")]+)['"]?\)/gi)
        if (urlMatches && urlMatches.length > 0) {
          console.log(`🔍 Encontradas ${urlMatches.length} URLs no CSS: ${asset.path}`)
          for (const match of urlMatches) {
            const urlMatch = match.match(/url\(['"]?([^'")]+)['"]?\)/i)
            if (urlMatch && urlMatch[1]) {
              const fontUrl = resolveUrl(asset.url, urlMatch[1])
              const normalizedFontUrl = fontUrl.split('?')[0]
              
              if (!downloadedUrls.has(normalizedFontUrl)) {
                try {
                  const { buffer } = await downloadFile(fontUrl)
                  if (buffer && buffer.length > 0) {
                    const fontType = getAssetType(fontUrl)
                    const urlObj = new URL(fontUrl)
                    let relativePath = urlObj.pathname || `assets/${fontUrl.split('/').pop()?.split('?')[0] || 'font'}`
                    relativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
                    if (addAsset(fontUrl, relativePath, fontType, buffer)) {
                      console.log(`✅ Fonte baixada: ${relativePath}`)
                    }
                  }
                } catch (error: any) {
                  console.warn(`⚠️ Erro ao baixar fonte ${fontUrl}:`, error.message)
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Erro ao processar CSS ${asset.path}:`, error.message)
      }
    }
  }

  // Garantir que temos pelo menos o HTML principal
  const assetsWithContent = assets.filter(a => {
    const hasContent = a.content && a.content.length > 0
    if (!hasContent) {
      console.warn(`⚠️ Asset sem conteúdo: ${a.path || a.url} (tipo: ${a.type})`)
    }
    return hasContent
  })
  
  if (assetsWithContent.length === 0) {
    console.error(`❌ Nenhum arquivo com conteúdo foi baixado!`)
    console.error(`   Total de assets coletados: ${assets.length}`)
    console.error(`   Assets por tipo:`, {
      html: assets.filter(a => a.type === 'html').length,
      css: assets.filter(a => a.type === 'css').length,
      js: assets.filter(a => a.type === 'js').length,
      image: assets.filter(a => a.type === 'image').length,
      other: assets.filter(a => a.type === 'other').length,
    })
    throw new Error('Nenhum arquivo foi baixado com sucesso. Verifique se a URL está acessível e se o site permite download de seus recursos.')
  }

  // Calcular tamanho total real
  const realTotalSize = assetsWithContent.reduce((sum, a) => sum + (a.content?.length || 0), 0)

  console.log(`✅ Crawling completo: ${assetsWithContent.length} assets com conteúdo (de ${assets.length} total), ${(realTotalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Detalhes: HTML: ${assetsWithContent.filter(a => a.type === 'html').length}, CSS: ${assetsWithContent.filter(a => a.type === 'css').length}, JS: ${assetsWithContent.filter(a => a.type === 'js').length}, Imagens: ${assetsWithContent.filter(a => a.type === 'image').length}`)
  
  // Retornar apenas assets com conteúdo
  return {
    assets: assetsWithContent,
    totalSize: realTotalSize,
    baseUrl,
    domain
  }
}







