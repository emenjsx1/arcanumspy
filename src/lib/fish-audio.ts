/**
 * Fish Audio API Integration
 * Documentação: https://docs.fish.audio/developer-guide/getting-started/introduction
 * 
 * A Fish Audio suporta:
 * - Voice Cloning: Criar modelos de voz customizados a partir de 15 segundos de áudio
 * - Text-to-Speech: Gerar fala natural com vozes clonadas
 * - Audio Storytelling: Criar narrativas multi-personagem
 */

const FISH_AUDIO_API_URL = process.env.FISH_AUDIO_API_URL || 'https://api.fish.audio'
const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY

// Debug: verificar se as variáveis estão carregadas (apenas server-side)
if (typeof window === 'undefined') {
}

if (!FISH_AUDIO_API_KEY) {
  console.error('❌ FISH_AUDIO_API_KEY não configurada!')
  console.error('📝 Configure FISH_AUDIO_API_KEY no .env.local e reinicie o servidor.')
  console.error('📝 Obtenha sua API Key em: https://fish.audio/app/api-keys/')
}

/**
 * Criar "clone de voz" - na verdade apenas salva o áudio de referência
 * 
 * IMPORTANTE: A Fish Audio REST API não tem endpoint para criar modelos persistentes.
 * O endpoint /v1/voices não existe na REST API (só no Python SDK).
 * 
 * SOLUÇÃO: Usar clonagem instantânea (on-the-fly) via /v1/tts com reference_audio.
 * 
 * Esta função apenas gera um UUID para identificar a voz e retorna sucesso.
 * O áudio será salvo no Supabase Storage e usado como reference_audio no generateTTS.
 * 
 * @param audioFile Arquivo de áudio (mínimo 15 segundos recomendado)
 * @param name Nome do modelo de voz
 * @param description Descrição opcional
 * @param visibility Visibilidade: 'private' ou 'public' (não usado, mas mantido para compatibilidade)
 */
export async function createVoiceClone(
  audioFile: File | Buffer, 
  name?: string,
  description?: string,
  visibility: 'private' | 'public' = 'private'
): Promise<{
  voice_id: string
  id?: string
  status: string
  title?: string
  audio_url?: string | null
}> {
  if (!FISH_AUDIO_API_KEY) {
    throw new Error('FISH_AUDIO_API_KEY não configurada. Configure a variável de ambiente FISH_AUDIO_API_KEY')
  }

  // IMPORTANTE: A Fish Audio REST API não tem endpoint /v1/voices para criar modelos persistentes
  // O endpoint só existe no Python SDK, não na REST API.
  // 
  // SOLUÇÃO: Usar clonagem instantânea via /v1/tts com reference_audio.
  // O áudio será salvo no Supabase Storage e usado como referência no TTS.
  
  // Gerar um UUID local para identificar esta "voz"
  // O áudio real será salvo no Supabase Storage e usado como reference_audio
  const crypto = require('crypto')
  const voiceId = crypto.randomUUID()
  
  
  // Retornar sucesso - o áudio será salvo pelo backend
  return {
    voice_id: voiceId,
    id: voiceId,
    status: 'ready', // Consideramos "ready" pois vamos usar clonagem instantânea
    title: name || 'Voz Clonada',
    audio_url: null, // Será preenchido pelo backend após salvar no Supabase Storage
  }
}

/**
 * Gerar áudio TTS com voz clonada
 * 
 * TESTADO E FUNCIONANDO! ✅
 * Endpoint confirmado: POST /v1/tts retorna audio/mpeg
 * 
 * Baseado na documentação da Fish Audio:
 * - Gera fala natural a partir de texto
 * - Suporta múltiplos formatos (MP3, WAV)
 * - Permite ajuste de velocidade, tom, etc.
 * - Suporta clonagem instantânea com reference_audio
 * - IMPORTANTE: Múltiplos áudios de referência melhoram a consistência e qualidade
 * 
 * @param voiceId ID do modelo de voz OU áudio de referência para clonagem instantânea
 * @param text Texto a ser convertido em fala
 * @param options Opções de geração (velocidade, tom, formato)
 * @param referenceAudio Áudio de referência para clonagem instantânea (base64, Buffer ou array de Buffers)
 * @param referenceText Texto falado no áudio de referência (opcional mas recomendado)
 */
export interface TTSOptions {
  model?: 's1' | 'speech-1.5' // Modelo: s1 (padrão) ou speech-1.5
  speed?: number // Velocidade: 0.7x a 1.3x (padrão: 1.0)
  pitch?: number // Tom: não alterar automaticamente
  volume?: number // Volume: -10 a 10 (padrão: 0)
  temperature?: number // Temperatura: 0.0 a 1.0 (padrão: 0.9)
  topP?: number // Top-p: 0.0 a 1.0 (padrão: 0.9)
  format?: 'mp3' | 'wav' // Formato: mp3 (padrão) ou wav
  emotion?: string // Emoção: opcional
  language?: string // Idioma: opcional
}

export async function generateTTS(
  voiceId: string,
  text: string,
  options?: TTSOptions,
  referenceAudio?: Buffer | string | Buffer[] | ReferenceAudio[],
  referenceText?: string | string[]
): Promise<Buffer> {
  if (!FISH_AUDIO_API_KEY) {
    throw new Error('FISH_AUDIO_API_KEY não configurada. Configure a variável de ambiente FISH_AUDIO_API_KEY')
  }

  if (!voiceId || !text) {
    throw new Error('voiceId e text são obrigatórios')
  }

  const endpoint = `${FISH_AUDIO_API_URL}/v1/tts`
  
  // 🚨 CRÍTICO: Verificar se voiceId é um reference_id válido da Fish API
  // IMPORTANTE: UUIDs locais (com hífens) NÃO são reference_id válidos!
  // Apenas IDs criados pela Fish API são válidos:
  // - 32 hex chars SEM hífens (ex: "8ef4a238714b45718ce04243307c57a7")
  // - IDs que começam com "model_" (criados via Python SDK)
  // UUIDs com hífens são IDs locais e devem usar reference_audio (clonagem instantânea)
  const isFishModelId = voiceId && (
    (voiceId.match(/^[0-9a-f]{32}$/i) && !voiceId.includes('-')) || // 32 hex chars SEM hífens (formato Fish)
    voiceId.startsWith('model_') // Modelos criados via Python SDK
  )
  
  // Modelo base (sempre "s1" conforme documentação)
  const selectedModel = options?.model || 's1'
  
  const requestBody: any = {
    text: text,
  }
  
  // 🚨 CRÍTICO: Se for model_id da Fish, usar reference_id (não reference_audio)
  if (isFishModelId) {
    requestBody.reference_id = voiceId // ✅ Usar reference_id conforme documentação
  } else if (referenceAudio) {
    // Clonagem instantânea: usar reference_audio (base64)
  } else {
    // Sem model_id e sem reference_audio: erro
    throw new Error('É necessário fornecer referenceAudio para clonagem instantânea OU usar um reference_id da Fish API.')
  }

  // Se tiver áudio de referência E não for model_id, usar clonagem instantânea
  if (referenceAudio && !isFishModelId) {
    // Clonagem instantânea: suportar múltiplas referências conforme Python SDK
    // A REST API pode aceitar múltiplas referências em um array
    
    // Verificar se é array de ReferenceAudio (formato Python SDK)
    if (Array.isArray(referenceAudio) && referenceAudio.length > 0) {
      const firstItem = referenceAudio[0]
      
      // Se for array de ReferenceAudio (objetos com audio e text)
      if (typeof firstItem === 'object' && 'audio' in firstItem) {
        // Formato: ReferenceAudio[]
        
        // A REST API pode aceitar múltiplas referências
        // Por enquanto, usar a primeira referência (mais representativa)
        // TODO: Verificar se REST API aceita array de referências
        const ref = referenceAudio[0] as ReferenceAudio
        const audioData = ref.audio instanceof Buffer ? ref.audio.toString('base64') : ref.audio
        requestBody.reference_audio = audioData
        
        if (ref.text) {
          requestBody.reference_text = ref.text
        }
        
        // Se tiver múltiplas referências, logar
        if (referenceAudio.length > 1) {
        }
        
      } else {
        // Formato: Buffer[] ou string[]
        // Usar o áudio mais representativo (mais longo)
        let bestAudio: Buffer | string = referenceAudio[0]
        let maxLength = referenceAudio[0] instanceof Buffer ? referenceAudio[0].length : (referenceAudio[0] as string).length
        
        for (let i = 0; i < referenceAudio.length; i++) {
          const audio = referenceAudio[i]
          const length = audio instanceof Buffer ? audio.length : (audio as string).length
          if (length > maxLength) {
            maxLength = length
            bestAudio = audio
          }
        }
        
        
        requestBody.reference_audio = bestAudio instanceof Buffer ? bestAudio.toString('base64') : bestAudio
        
        // Adicionar transcrição se disponível (array ou string única)
        if (referenceText) {
          if (Array.isArray(referenceText) && referenceText.length > 0) {
            // Usar transcrição do áudio selecionado
            const selectedIndex = referenceAudio.indexOf(bestAudio)
            requestBody.reference_text = referenceText[selectedIndex] || referenceText[0]
          } else {
            requestBody.reference_text = referenceText as string
          }
        }
      }
      
    } else if (referenceAudio instanceof Buffer) {
      // Áudio único (Buffer)
      requestBody.reference_audio = referenceAudio.toString('base64')
      
      if (referenceText) {
        requestBody.reference_text = Array.isArray(referenceText) ? referenceText[0] : referenceText
      }
    } else {
      // String (base64)
      requestBody.reference_audio = referenceAudio as string
      
      if (referenceText) {
        requestBody.reference_text = Array.isArray(referenceText) ? referenceText[0] : referenceText
      }
    }
  }
  
  // 🚨 CRÍTICO: Modelo sempre "s1" conforme documentação oficial
  // O modelo é especificado no HEADER, não no body
  // Body não deve ter campo "model" quando usar reference_id ou reference_audio

  // Adicionar opções opcionais com valores padrão
  // Velocidade: 0.7x a 1.3x (padrão: 1.0)
  if (options?.speed !== undefined) {
    requestBody.speed = Math.max(0.7, Math.min(1.3, options.speed))
  } else {
    requestBody.speed = 1.0 // Padrão
  }
  
  // Tom: não alterar automaticamente (padrão: 1.0)
  if (options?.pitch !== undefined) {
    requestBody.pitch = options.pitch
  } else {
    requestBody.pitch = 1.0 // Padrão (não alterar tom)
  }
  
  // Volume: -10 a 10 (padrão: 0)
  if (options?.volume !== undefined) {
    requestBody.volume = Math.max(-10, Math.min(10, options.volume))
  } else {
    requestBody.volume = 0 // Padrão
  }
  
  // Temperatura: 0.0 a 1.0 (padrão: 0.1) - 🚨 CRÍTICO: 0.1 para determinismo e preservação de gênero
  if (options?.temperature !== undefined) {
    requestBody.temperature = Math.max(0.0, Math.min(1.0, options.temperature))
  } else {
    requestBody.temperature = 0.1 // 🚨 CRÍTICO: Padrão 0.1 (determinístico, preserva gênero/timbre)
  }
  
  // Top-p: 0.0 a 1.0 (padrão: 0.9) - para alta qualidade
  if (options?.topP !== undefined) {
    requestBody.top_p = Math.max(0.0, Math.min(1.0, options.topP))
  } else {
    requestBody.top_p = 0.9 // Padrão (alta qualidade)
  }
  
  // Formato: mp3 (padrão) ou wav
  if (options?.format) {
    requestBody.format = options.format
  } else {
    requestBody.format = 'mp3' // Padrão MP3
  }

  // Normalize: opcional (padrão: true conforme documentação)
  if (options?.normalize !== undefined) {
    requestBody.normalize = options.normalize
  } else {
    requestBody.normalize = true // Padrão: true
  }

  // Latency: opcional ("normal" ou "low")
  if (options?.latency) {
    requestBody.latency = options.latency
  } else {
    requestBody.latency = 'normal' // Padrão: normal
  }

  // Emoção: opcional (pode ser incluída no texto como "(happy)" ou via campo emotion)
  if (options?.emotion) {
    requestBody.emotion = options.emotion
  }

  // Idioma: CRÍTICO para preservar sotaque
  // Se não especificado, pode assumir português brasileiro (pt-BR) por padrão
  // Para preservar sotaque moçambicano, deve especificar ou não especificar e deixar o modelo detectar do áudio
  if (options?.language) {
    requestBody.language = options.language
  } else {
    // IMPORTANTE: Se não especificar idioma, o modelo deve detectar do áudio de referência
    // Mas pode assumir pt-BR como padrão (problema!)
    // Para sotaque moçambicano, pode ser necessário especificar ou deixar em branco
  }

  // 🚨 CRÍTICO: Headers conforme documentação oficial
  // O modelo "s1" DEVE estar no HEADER, não no body
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
    'Content-Type': 'application/json',
    'model': 's1', // 🚨 CRÍTICO: Sempre "s1" no header conforme documentação
  }

  // DEBUG: Log completo do request antes de enviar
  
  if (requestBody.reference_id) {
  } else if (requestBody.reference_audio) {
  } else {
  }
  
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    })
    

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Erro ao gerar TTS: ${response.status} ${response.statusText}`
      
      console.error(`❌ Erro na resposta da Fish Audio API:`)
      console.error(`   Status: ${response.status} ${response.statusText}`)
      console.error(`   Response: ${errorText.substring(0, 500)}`)
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorJson.details || errorMessage
        console.error(`   Erro parseado:`, errorJson)
      } catch {
        errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`
      }
      
      throw new Error(errorMessage)
    }
    

    // Verificar se a resposta é áudio binário
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.startsWith('audio/')) {
      // Retorna o áudio como Buffer
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } else {
      // Se for JSON (algumas APIs retornam URL ou objeto)
      const data = await response.json()
      
      if (data.audio_url) {
        // Se retornar URL, fazer fetch do áudio
        const audioResponse = await fetch(data.audio_url)
        const audioBuffer = await audioResponse.arrayBuffer()
        return Buffer.from(audioBuffer)
      } else if (data.audio) {
        // Se retornar base64
        return Buffer.from(data.audio, 'base64')
      } else {
        throw new Error('Formato de resposta inesperado da API')
      }
    }
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      throw new Error('Endpoint /v1/tts não encontrado. Verifique a documentação da Fish Audio API.')
    }
    throw error
  }
}

/**
 * Gerar hash do texto para cache
 */
export function generateTextHash(text: string): string {
  // Usar crypto do Node.js para gerar hash mais robusto
  if (typeof window === 'undefined') {
    // Server-side: usar crypto do Node.js
    const crypto = require('crypto')
    return crypto.createHash('md5').update(text).digest('hex')
  } else {
    // Client-side: usar hash simples (mas nunca será chamado no client)
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

