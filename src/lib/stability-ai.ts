/**
 * Stability AI API Client
 * Documentação: https://platform.stability.ai/
 */

import FormData from 'form-data'
import https from 'https'
import { URL } from 'url'

const STABILITY_API_KEY = process.env.STABILITY_API_KEY || "sk-BMOHox7VK5GJWBSlGMip51yQw2wZQS0wGgXiZXkKDiVumJJU"
const STABILITY_API_URL = "https://api.stability.ai"

export interface StabilityImageGenerationRequest {
  prompt: string
  width?: number
  height?: number
  steps?: number
  seed?: number
  cfg_scale?: number
  samples?: number
  style_preset?: string
}

export interface StabilityUpscaleRequest {
  image: Buffer | File
  width?: number
  height?: number
}

export interface StabilityBackgroundRemovalRequest {
  image: Buffer | File
}

/**
 * Gera uma imagem usando Stable Diffusion
 */
export async function generateImage(request: StabilityImageGenerationRequest): Promise<string> {
  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY não configurada')
  }

  const {
    prompt,
    width = 1024,
    height = 1024,
    steps = 30,
    seed,
    cfg_scale = 7,
    samples = 1,
    style_preset
  } = request

  // Dimensões permitidas pela Stability AI para stable-diffusion-xl-1024-v1-0
  const allowedDimensions = [
    { width: 1024, height: 1024 },
    { width: 1152, height: 896 },
    { width: 1216, height: 832 },
    { width: 1344, height: 768 },
    { width: 1536, height: 640 },
    { width: 640, height: 1536 },
    { width: 768, height: 1344 },
    { width: 832, height: 1216 },
    { width: 896, height: 1152 },
  ]

  // Encontrar a dimensão permitida mais próxima mantendo aspect ratio
  const aspectRatio = width / height
  let bestMatch = allowedDimensions[0] // Default: 1024x1024
  let minDifference = Infinity

  for (const dim of allowedDimensions) {
    const dimAspectRatio = dim.width / dim.height
    const difference = Math.abs(aspectRatio - dimAspectRatio)
    
    if (difference < minDifference) {
      minDifference = difference
      bestMatch = dim
    }
  }

  const adjustedWidth = bestMatch.width
  const adjustedHeight = bestMatch.height

  if (width !== adjustedWidth || height !== adjustedHeight) {
    console.log(`⚠️ Dimensões ajustadas de ${width}x${height} para ${adjustedWidth}x${adjustedHeight} (aspect ratio: ${(adjustedWidth/adjustedHeight).toFixed(2)})`)
  }

  const requestBody = {
    text_prompts: [
      {
        text: prompt,
        weight: 1
      }
    ],
    cfg_scale,
    height: adjustedHeight || 1024,
    width: adjustedWidth || 1024,
    steps,
    samples,
    ...(seed && { seed }),
    ...(style_preset && { style_preset }),
  }

  console.log('📤 Enviando requisição para Stability AI:', {
    url: `${STABILITY_API_URL}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
    dimensions: `${adjustedWidth || 1024}x${adjustedHeight || 1024}`,
    promptLength: prompt.length
  })

  const response = await fetch(
    `${STABILITY_API_URL}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    }
  )

  const responseText = await response.text()
  console.log('📥 Resposta da Stability AI:', {
    status: response.status,
    statusText: response.statusText,
    responseLength: responseText.length
  })

  if (!response.ok) {
    let errorMessage = `Stability AI error: ${response.status}`
    try {
      const errorJson = JSON.parse(responseText)
      errorMessage = errorJson.message || errorJson.name || errorJson.error || errorMessage
      console.error('❌ Erro detalhado da Stability AI:', errorJson)
    } catch {
      errorMessage = responseText || errorMessage
      console.error('❌ Erro da Stability AI (texto):', responseText.substring(0, 500))
    }
    throw new Error(errorMessage)
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch (parseError) {
    console.error('❌ Erro ao parsear resposta JSON:', parseError)
    throw new Error('Resposta inválida da API da Stability AI')
  }
  
  // A resposta vem com base64 das imagens
  if (data.artifacts && data.artifacts.length > 0) {
    const artifact = data.artifacts[0]
    if (artifact.base64) {
      const imageBase64 = artifact.base64
      console.log('✅ Imagem gerada com sucesso, tamanho base64:', imageBase64.length)
      return `data:image/png;base64,${imageBase64}`
    } else if (artifact.finishReason) {
      throw new Error(`Geração bloqueada: ${artifact.finishReason}`)
    }
  }

  console.error('❌ Resposta da API não contém imagem:', data)
  throw new Error('Nenhuma imagem foi gerada pela API')
}

/**
 * Faz upscale de uma imagem usando Real-ESRGAN (rápido) ou Stable Diffusion 4x Upscaler (qualidade)
 */
export async function upscaleImage(
  image: Buffer | File,
  model: 'esrgan-v1-x2plus' | 'stable-diffusion-x4-latent-upscaler' = 'esrgan-v1-x2plus'
): Promise<string> {
  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY não configurada')
  }

  // Converter imagem para Buffer se necessário
  let imageBuffer: Buffer
  if (image instanceof File) {
    // Se for File (browser), converter para Buffer primeiro
    const arrayBuffer = await image.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
  } else {
    // Se for Buffer (Node.js)
    imageBuffer = image
  }

  // Usar form-data para Node.js
  const formData = new FormData()
  formData.append('image', imageBuffer, {
    filename: image instanceof File ? (image.name || 'image.png') : 'image.png',
    contentType: image instanceof File ? (image.type || 'image/png') : 'image/png'
  })

  // Escolher o endpoint baseado no modelo
  // Documentação: https://platform.stability.ai/docs/api-reference#tag/Image-to-Image/operation/upscaleImage
  const endpoint = model === 'esrgan-v1-x2plus'
    ? `${STABILITY_API_URL}/v1/image-to-image/upscale/esrgan-v1-x2plus`
    : `${STABILITY_API_URL}/v1/image-to-image/upscale/stable-diffusion-x4-latent-upscaler`

  // Verificar se a API key está configurada
  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY não configurada. Configure a variável de ambiente STABILITY_API_KEY.')
  }

  console.log('📤 Enviando requisição de upscale para Stability AI:', {
    endpoint,
    model,
    imageSize: imageBuffer.length,
    apiKey: `${STABILITY_API_KEY.substring(0, 10)}...`
  })

  // Usar https nativo do Node.js para garantir compatibilidade com form-data
  const url = new URL(endpoint)
  const responseText = await new Promise<string>((resolve, reject) => {
    try {
      // Obter headers do form-data de forma segura
      let formHeaders: Record<string, string> = {}
      try {
        formHeaders = formData.getHeaders() as Record<string, string>
      } catch (headerError) {
        console.warn('⚠️ Erro ao obter headers do form-data, usando headers padrão:', headerError)
        // Se getHeaders() falhar, usar Content-Type padrão
        formHeaders = {
          'Content-Type': 'multipart/form-data'
        }
      }
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${STABILITY_API_KEY}`,
          ...formHeaders, // Headers do form-data (inclui Content-Type com boundary)
        },
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data)
          } else {
            let errorMessage = `Stability AI upscale error: ${res.statusCode}`
            try {
              const errorJson = JSON.parse(data)
              errorMessage = errorJson.message || errorJson.name || errorMessage
              if (errorJson.errors) {
                errorMessage += ` - ${JSON.stringify(errorJson.errors)}`
              }
              console.error('❌ Erro detalhado da Stability AI (upscale):', errorJson)
            } catch {
              errorMessage = data.substring(0, 500) || errorMessage
              console.error('❌ Erro da Stability AI (upscale, texto):', errorMessage)
            }
            reject(new Error(errorMessage))
          }
        })
      })

      req.on('error', (error) => {
        console.error('❌ Erro na requisição HTTPS (upscale):', {
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
        console.error('❌ Erro ao fazer pipe do form-data (upscale):', error)
        reject(error)
      })
    } catch (error: any) {
      console.error('❌ Erro ao preparar requisição (upscale):', error)
      reject(error)
    }
  })

  console.log('📥 Resposta da Stability AI (upscale):', {
    responseLength: responseText.length
  })

  let data
  try {
    data = JSON.parse(responseText)
  } catch (parseError) {
    console.error('❌ Erro ao parsear resposta JSON (upscale):', parseError)
    throw new Error('Resposta inválida da API da Stability AI')
  }
  
  // A resposta vem com base64 da imagem
  if (data.artifacts && data.artifacts.length > 0) {
    const imageBase64 = data.artifacts[0].base64
    console.log('✅ Upscale concluído com sucesso, tamanho base64:', imageBase64.length)
    return `data:image/png;base64,${imageBase64}`
  }

  console.error('❌ Resposta da API não contém imagem (upscale):', data)
  throw new Error('Erro ao fazer upscale da imagem')
}

/**
 * Remove o fundo de uma imagem
 */
export async function removeBackground(image: Buffer | File): Promise<string> {
  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY não configurada')
  }

  // Usar form-data para Node.js
  // Documentação da Stability AI: o campo deve ser 'image' e aceita PNG, JPG, WEBP
  const formData = new FormData()
  
  if (image instanceof File) {
    // Se for File (browser), converter para Buffer primeiro
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = image.name || 'image.png'
    const contentType = image.type || 'image/png'
    
    console.log('📎 Preparando form-data (File) - remove background:', {
      filename,
      contentType,
      size: buffer.length
    })
    
    formData.append('image', buffer, {
      filename,
      contentType
    })
  } else {
    // Se for Buffer (Node.js)
    console.log('📎 Preparando form-data (Buffer) - remove background:', {
      size: image.length,
      contentType: 'image/png'
    })
    
    formData.append('image', image, {
      filename: 'image.png',
      contentType: 'image/png'
    })
  }

  console.log('📤 Enviando requisição de remoção de background para Stability AI:', {
    imageSize: image instanceof File ? image.size : image.length,
    apiKey: STABILITY_API_KEY ? `${STABILITY_API_KEY.substring(0, 10)}...` : 'NÃO CONFIGURADA'
  })

  // Usar https nativo do Node.js para garantir compatibilidade com form-data
  const endpoint = `${STABILITY_API_URL}/v2beta/stable-image/edit/erase-background`
  const url = new URL(endpoint)
  const responseText = await new Promise<string>((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        ...formData.getHeaders(), // Headers do form-data (inclui Content-Type com boundary)
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data)
        } else {
          let errorMessage = `Stability AI background removal error: ${res.statusCode}`
          try {
            const errorJson = JSON.parse(data)
            errorMessage = errorJson.message || errorJson.name || errorMessage
            console.error('❌ Erro detalhado da Stability AI (remove background):', errorJson)
          } catch {
            errorMessage = data.substring(0, 500) || errorMessage
            console.error('❌ Erro da Stability AI (remove background, texto):', errorMessage)
          }
          reject(new Error(errorMessage))
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Erro na requisição HTTPS (remove background):', {
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
      console.error('❌ Erro ao fazer pipe do form-data (remove background):', error)
      reject(error)
    })
  })

  console.log('📥 Resposta da Stability AI (remove background):', {
    responseLength: responseText.length
  })

  let data
  try {
    data = JSON.parse(responseText)
  } catch (parseError) {
    console.error('❌ Erro ao parsear resposta JSON (remove background):', parseError)
    throw new Error('Resposta inválida da API da Stability AI')
  }
  
  // A resposta vem com base64 da imagem
  if (data.image) {
    console.log('✅ Background removido com sucesso')
    return `data:image/png;base64,${data.image}`
  }

  // Tentar formato alternativo
  if (data.artifacts && data.artifacts.length > 0) {
    const imageBase64 = data.artifacts[0].base64
    console.log('✅ Background removido com sucesso (formato alternativo)')
    return `data:image/png;base64,${imageBase64}`
  }

  console.error('❌ Resposta da API não contém imagem (remove background):', data)
  throw new Error('Erro ao remover o fundo da imagem')
}

/**
 * Lista os modelos disponíveis
 */
export async function listModels(): Promise<any> {
  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY não configurada')
  }

  const response = await fetch(
    `${STABILITY_API_URL}/v1/engines/list`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Erro ao listar modelos: ${response.status}`)
  }

  return await response.json()
}

