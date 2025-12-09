/**
 * Utilitários de Segurança para Clonagem de Sites
 * Proteção contra SSRF e validação de URLs
 */

import { URL } from 'url'

/**
 * Valida se uma URL é segura para clonagem
 * Bloqueia IPs privados, localhost e protocolos não permitidos
 */
export function validateUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString)

    // 1. Validar protocolo (apenas http e https)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        valid: false,
        error: 'Apenas protocolos HTTP e HTTPS são permitidos'
      }
    }

    // 2. Validar hostname
    const hostname = url.hostname.toLowerCase()

    // Bloquear localhost e variações
    const localhostPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '[::1]'
    ]

    if (localhostPatterns.some(pattern => hostname.includes(pattern))) {
      return {
        valid: false,
        error: 'Acesso a localhost não é permitido'
      }
    }

    // 3. Bloquear IPs privados
    if (isPrivateIP(hostname)) {
      return {
        valid: false,
        error: 'Acesso a IPs privados não é permitido'
      }
    }

    // 4. Bloquear domínios internos comuns
    const blockedDomains = [
      '.local',
      '.internal',
      '.corp',
      '.lan'
    ]

    if (blockedDomains.some(domain => hostname.includes(domain))) {
      return {
        valid: false,
        error: 'Acesso a domínios internos não é permitido'
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'URL inválida'
    }
  }
}

/**
 * Verifica se um hostname é um IP privado
 */
function isPrivateIP(hostname: string): boolean {
  // Tentar parsear como IP
  const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const match = hostname.match(ipPattern)

  if (!match) {
    return false // Não é um IP, é um hostname
  }

  const [, a, b, c, d] = match.map(Number)

  // Verificar se está em range privado
  // 10.0.0.0/8
  if (a === 10) return true

  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true

  // 192.168.0.0/16
  if (a === 192 && b === 168) return true

  // 169.254.0.0/16 (link-local)
  if (a === 169 && b === 254) return true

  return false
}

/**
 * Valida tamanho máximo de download
 */
export function validateSize(currentSize: number, maxSize: number = 100 * 1024 * 1024): boolean {
  return currentSize <= maxSize
}

