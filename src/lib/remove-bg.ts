/**
 * Remove.bg API Client
 * Documentação: https://www.remove.bg/api
 */

import FormData from 'form-data'
import https from 'https'
import { URL } from 'url'

// REMOVE_BG_API_KEY deve ser configurada como variável de ambiente
// Não usar fallback hardcoded em produção por segurança
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY
const REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg"

export interface RemoveBgOptions {
  size?: 'auto' | 'regular' | 'hd' | '4k' | '50MP'
  format?: 'png' | 'jpg' | 'zip'
  type?: 'auto' | 'person' | 'product' | 'car' | 'animal' | 'graphic' | 'transportation'
  type_level?: number
  crop?: boolean
  crop_margin?: string
  scale?: string
  position?: string
  roi?: string
  bg_color?: string
  bg_image_url?: string
  bg_image_file?: Buffer | File
  channels?: 'rgba' | 'alpha'
  add_shadow?: boolean
  semitransparency?: boolean
  shadow_type?: 'realistic' | 'drop' | 'none'
  shadow_opacity?: number
}

/**
 * Remove o fundo de uma imagem usando a API do remove.bg
 * 
 * @param image - Buffer ou File da imagem
 * @param options - Opções de processamento
 * @returns Data URL da imagem sem fundo (base64)
 */
export async function removeBackground(
  image: Buffer | File,
  options: RemoveBgOptions = {}
): Promise<string> {
  if (!REMOVE_BG_API_KEY) {
    throw new Error('REMOVE_BG_API_KEY não configurada')
  }

  // Usar form-data para Node.js
  // Documentação: https://www.remove.bg/api#remove-background
  const formData = new FormData()
  
  if (image instanceof File) {
    // Se for File (browser), converter para Buffer primeiro
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = image.name || 'image.jpg'
    const contentType = image.type || 'image/jpeg'
    
    console.log('📎 Preparando form-data (File) - remove.bg:', {
      filename,
      contentType,
      size: buffer.length
    })
    
    formData.append('image_file', buffer, {
      filename,
      contentType
    })
  } else {
    // Se for Buffer (Node.js)
    console.log('📎 Preparando form-data (Buffer) - remove.bg:', {
      size: image.length,
      contentType: 'image/jpeg'
    })
    
    formData.append('image_file', image, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    })
  }

  // Adicionar parâmetros opcionais
  if (options.size) {
    formData.append('size', options.size)
  } else {
    formData.append('size', 'auto') // Padrão: auto
  }

  if (options.format) {
    formData.append('format', options.format)
  }

  if (options.type) {
    formData.append('type', options.type)
  }

  if (options.type_level !== undefined) {
    formData.append('type_level', options.type_level.toString())
  }

  if (options.crop !== undefined) {
    formData.append('crop', options.crop.toString())
  }

  if (options.crop_margin) {
    formData.append('crop_margin', options.crop_margin)
  }

  if (options.scale) {
    formData.append('scale', options.scale)
  }

  if (options.position) {
    formData.append('position', options.position)
  }

  if (options.roi) {
    formData.append('roi', options.roi)
  }

  if (options.bg_color) {
    formData.append('bg_color', options.bg_color)
  }

  if (options.bg_image_url) {
    formData.append('bg_image_url', options.bg_image_url)
  }

  if (options.channels) {
    formData.append('channels', options.channels)
  }

  if (options.add_shadow !== undefined) {
    formData.append('add_shadow', options.add_shadow.toString())
  }

  if (options.semitransparency !== undefined) {
    formData.append('semitransparency', options.semitransparency.toString())
  }

  if (options.shadow_type) {
    formData.append('shadow_type', options.shadow_type)
  }

  if (options.shadow_opacity !== undefined) {
    formData.append('shadow_opacity', options.shadow_opacity.toString())
  }

  console.log('📤 Enviando requisição para remove.bg:', {
    imageSize: image instanceof File ? image.size : image.length,
    options,
    apiKey: REMOVE_BG_API_KEY ? `${REMOVE_BG_API_KEY.substring(0, 10)}...` : 'NÃO CONFIGURADA'
  })

  // Usar https nativo do Node.js para garantir compatibilidade com form-data
  const url = new URL(REMOVE_BG_API_URL)
  const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
        ...formData.getHeaders(), // Headers do form-data (inclui Content-Type com boundary)
      },
    }

    const req = https.request(requestOptions, (res) => {
      // A resposta é uma imagem binária (PNG por padrão)
      const chunks: Buffer[] = []
      
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          const imageBuffer = Buffer.concat(chunks)
          console.log('✅ Background removido com sucesso:', {
            statusCode: res.statusCode,
            imageSize: imageBuffer.length,
            contentType: res.headers['content-type'],
            // Sistema baseado em planos - não há mais cobrança de créditos
          })
          resolve(imageBuffer)
        } else {
          let errorMessage = `remove.bg error: ${res.statusCode}`
          try {
            // Tentar parsear erro JSON se disponível
            const errorText = Buffer.concat(chunks).toString('utf-8')
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.errors?.[0]?.title || errorJson.message || errorMessage
            console.error('❌ Erro detalhado do remove.bg:', errorJson)
          } catch {
            const errorText = Buffer.concat(chunks).toString('utf-8')
            errorMessage = errorText.substring(0, 500) || errorMessage
            console.error('❌ Erro do remove.bg (texto):', errorMessage)
          }
          reject(new Error(errorMessage))
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Erro na requisição HTTPS (remove.bg):', {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        errno: (error as any).errno,
        syscall: (error as any).syscall
      })
      reject(error)
    })

    // Pipe form-data para a requisição
    formData.pipe(req).on('error', (error) => {
      console.error('❌ Erro ao fazer pipe do form-data (remove.bg):', error)
      reject(error)
    })
  })

  // Converter buffer para data URL base64
  const base64Image = imageBuffer.toString('base64')
  return `data:image/png;base64,${base64Image}`
}

/**
 * Verifica o saldo de créditos da conta
 */
export async function getAccountInfo(): Promise<any> {
  if (!REMOVE_BG_API_KEY) {
    throw new Error('REMOVE_BG_API_KEY não configurada')
  }

  const url = new URL('https://api.remove.bg/v1.0/account')
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const accountInfo = JSON.parse(data)
            resolve(accountInfo)
          } catch (error) {
            reject(new Error('Erro ao parsear resposta da API'))
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}



