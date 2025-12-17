/**
 * Helper para adicionar cache HTTP em respostas de API
 */

import { NextResponse } from 'next/server'

export interface CacheOptions {
  maxAge?: number // Tempo em segundos (padrão: 60)
  staleWhileRevalidate?: number // Tempo em segundos para stale-while-revalidate
  private?: boolean // Se true, cache apenas no cliente (não em CDN)
  mustRevalidate?: boolean // Se true, sempre revalidar
}

/**
 * Adiciona headers de cache HTTP à resposta
 */
export function withCache(
  response: NextResponse,
  options: CacheOptions = {}
): NextResponse {
  const {
    maxAge = 60, // 1 minuto padrão
    staleWhileRevalidate,
    private: isPrivate = false,
    mustRevalidate = false,
  } = options

  // Cache-Control header
  const cacheDirectives: string[] = []

  if (isPrivate) {
    cacheDirectives.push('private')
  } else {
    cacheDirectives.push('public')
  }

  cacheDirectives.push(`max-age=${maxAge}`)

  if (staleWhileRevalidate) {
    cacheDirectives.push(`stale-while-revalidate=${staleWhileRevalidate}`)
  }

  if (mustRevalidate) {
    cacheDirectives.push('must-revalidate')
  }

  response.headers.set('Cache-Control', cacheDirectives.join(', '))

  // ETag para validação condicional (opcional, pode ser implementado depois)
  // response.headers.set('ETag', generateETag(data))

  return response
}

/**
 * Cache longo para dados estáticos (categorias, nichos, etc.)
 */
export function withLongCache(response: NextResponse): NextResponse {
  return withCache(response, {
    maxAge: 300, // 5 minutos
    staleWhileRevalidate: 600, // 10 minutos
    private: false,
  })
}

/**
 * Cache médio para dados semi-estáticos (stats, etc.)
 */
export function withMediumCache(response: NextResponse): NextResponse {
  return withCache(response, {
    maxAge: 60, // 1 minuto
    staleWhileRevalidate: 120, // 2 minutos
    private: true, // Dados específicos do usuário
    mustRevalidate: false,
  })
}

/**
 * Cache curto para dados dinâmicos
 */
export function withShortCache(response: NextResponse): NextResponse {
  return withCache(response, {
    maxAge: 30, // 30 segundos
    staleWhileRevalidate: 60, // 1 minuto
    private: true,
  })
}

/**
 * Sem cache (dados sensíveis ou muito dinâmicos)
 */
export function withNoCache(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}









