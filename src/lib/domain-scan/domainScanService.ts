/**
 * Service principal que orquestra todas as verificações de domínio
 */

import { fetchHTML, type FetchResult } from './fetchHTML'
import { extractLinks } from './extractLinks'
import { detectTech } from './detectTech'
import { scanRoutes, type SensitiveRoute } from './scanRoutes'
import { getRobots, type RobotsInfo } from './getRobots'
import { getSitemap, type SitemapInfo } from './getSitemap'
import { scanSubdomains, type SubdomainResult } from './scanSubdomains'

export interface DomainScanResult {
  status: {
    online: boolean
    code: number
  }
  technologies: Array<{
    name: string
    version?: string
    confidence: 'high' | 'medium' | 'low'
    method: 'header' | 'html' | 'cookie' | 'meta'
  }>
  urls_found: Array<{
    url: string
    text?: string
    type: 'link' | 'script' | 'style' | 'image' | 'form'
  }>
  subdomains: Array<{
    subdomain: string
    url: string
    status: number
    accessible: boolean
  }>
  robots: {
    found: boolean
    content: string
    blocked_paths: string[]
  }
  sitemap: {
    found: boolean
    urls: string[]
  }
  sensitive_routes: Array<{
    path: string
    status: number
    accessible: boolean
    type: 'admin' | 'login' | 'api' | 'config' | 'backup' | 'other'
  }>
  potential_alerts: string[]
  scanned_at: string
}

export async function scanDomain(domain: string): Promise<DomainScanResult> {
  const scannedAt = new Date().toISOString()
  const alerts: string[] = []

  // Normalizar domínio
  let normalizedDomain = domain.trim()
  if (!normalizedDomain.startsWith('http://') && !normalizedDomain.startsWith('https://')) {
    normalizedDomain = `https://${normalizedDomain}`
  }

  // 1. Buscar página principal
  const htmlResult = await fetchHTML(normalizedDomain, 10000)
  
  const status = {
    online: htmlResult !== null && htmlResult.status >= 200 && htmlResult.status < 400,
    code: htmlResult?.status || 0
  }

  // Se o domínio não estiver online, retornar resultado básico
  if (!htmlResult || !status.online) {
    return {
      status,
      technologies: [],
      urls_found: [],
      subdomains: [],
      robots: {
        found: false,
        content: '',
        blocked_paths: []
      },
      sitemap: {
        found: false,
        urls: []
      },
      sensitive_routes: [],
      potential_alerts: ['Domínio não está acessível ou retornou erro'],
      scanned_at: scannedAt
    }
  }

  // 2. Executar verificações em paralelo quando possível
  const [
    links,
    technologies,
    robotsInfo,
    sitemapInfo,
    sensitiveRoutes,
    subdomains
  ] = await Promise.all([
    // Extrair links do HTML
    Promise.resolve(extractLinks(htmlResult.html, normalizedDomain)),
    
    // Detectar tecnologias
    Promise.resolve(detectTech(htmlResult.headers, htmlResult.html)),
    
    // Buscar robots.txt
    getRobots(normalizedDomain, 10000),
    
    // Buscar sitemap.xml
    getSitemap(normalizedDomain, 10000),
    
    // Escanear rotas sensíveis
    scanRoutes(normalizedDomain, 10000),
    
    // Escanear subdomínios
    scanSubdomains(normalizedDomain, 10000)
  ])

  // 3. Verificar alertas de segurança
  checkSecurityAlerts(htmlResult, alerts)

  // 4. Verificar rotas sensíveis acessíveis
  const accessibleSensitiveRoutes = sensitiveRoutes.filter(r => r.accessible)
  if (accessibleSensitiveRoutes.length > 0) {
    alerts.push(`${accessibleSensitiveRoutes.length} rota(s) sensível(is) acessível(eis): ${accessibleSensitiveRoutes.map(r => r.path).join(', ')}`)
  }

  // 5. Verificar subdomínios acessíveis
  const accessibleSubdomains = subdomains.filter(s => s.accessible)
  if (accessibleSubdomains.length > 0) {
    // Não é necessariamente um alerta, mas pode ser informativo
  }

  // 6. Verificar SSL
  if (!normalizedDomain.startsWith('https://')) {
    alerts.push('Domínio não usa HTTPS')
  }

  // 7. Verificar exposição de versões
  const techWithVersions = technologies.filter(t => t.version)
  if (techWithVersions.length > 0) {
    alerts.push(`Versões de software expostas: ${techWithVersions.map(t => `${t.name} ${t.version}`).join(', ')}`)
  }

  return {
    status,
    technologies: technologies.map(t => ({
      name: t.name,
      version: t.version,
      confidence: t.confidence,
      method: t.method
    })),
    urls_found: links.map(l => ({
      url: l.url,
      text: l.text,
      type: l.type
    })),
    subdomains: subdomains.map(s => ({
      subdomain: s.subdomain,
      url: s.url,
      status: s.status,
      accessible: s.accessible
    })),
    robots: {
      found: robotsInfo.found,
      content: robotsInfo.content,
      blocked_paths: robotsInfo.blocked_paths
    },
    sitemap: {
      found: sitemapInfo.found,
      urls: sitemapInfo.urls
    },
    sensitive_routes: sensitiveRoutes.map(r => ({
      path: r.path,
      status: r.status,
      accessible: r.accessible,
      type: r.type
    })),
    potential_alerts: alerts,
    scanned_at: scannedAt
  }
}

function checkSecurityAlerts(htmlResult: FetchResult, alerts: string[]) {
  const headers = htmlResult.headers

  // Verificar headers de segurança ausentes
  const securityHeaders = [
    { name: 'x-frame-options', description: 'X-Frame-Options' },
    { name: 'x-content-type-options', description: 'X-Content-Type-Options' },
    { name: 'x-xss-protection', description: 'X-XSS-Protection' },
    { name: 'strict-transport-security', description: 'Strict-Transport-Security (HSTS)' },
    { name: 'content-security-policy', description: 'Content-Security-Policy' },
    { name: 'referrer-policy', description: 'Referrer-Policy' }
  ]

  for (const header of securityHeaders) {
    if (!headers[header.name]) {
      alerts.push(`Header de segurança ausente: ${header.description}`)
    }
  }

  // Verificar Server header exposto (pode revelar versão)
  if (headers['server'] && headers['server'].includes('/')) {
    alerts.push(`Server header exposto: ${headers['server']}`)
  }

  // Verificar X-Powered-By exposto
  if (headers['x-powered-by']) {
    alerts.push(`X-Powered-By header exposto: ${headers['x-powered-by']}`)
  }

  // Verificar status code
  if (htmlResult.status >= 400 && htmlResult.status < 500) {
    alerts.push(`Erro do cliente (${htmlResult.status}) - pode indicar problemas de configuração`)
  }

  if (htmlResult.status >= 500) {
    alerts.push(`Erro do servidor (${htmlResult.status}) - pode indicar problemas de segurança`)
  }
}










