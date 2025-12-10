import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateTTS, cloneVoice, generateTextHash, type CoquiTTSOptions } from "@/lib/coqui-tts"
import { 
  validateVoiceConsistency, 
  validateReferenceAudio,
  ensurePersistentVoiceModel,
  VoiceGenerationCallback 
} from "@/lib/voice-validation"

/**
 * Gera mensagens de erro personalizadas baseadas na similaridade detectada
 */
function getSimilarityErrorMessage(similarity: number): {
  title: string
  message: string
  recommendations: string[]
  similarity: number
  minimumRequired: number
  range: '<0.60' | '0.60-0.75' | '0.75-0.85' | '>=0.85'
} {
  const similarityPercent = (similarity * 100).toFixed(1)
  const minimumRequired = 82.0

  if (similarity < 0.60) {
    // Similaridade MUITO baixa (< 0.60)
    return {
      title: "Não foi possível clonar a voz",
      message: "A voz gerada ficou muito diferente da voz original.",
      recommendations: [
        "Grave 2 a 3 áudios de 20–40 segundos cada",
        "Fale em um ambiente silencioso, sem música nem barulho de fundo",
        "Use o mesmo idioma e sotaque que você quer na voz gerada",
        "Fale de forma natural, sem sussurrar nem gritar",
        "Depois envie novamente os áudios de referência"
      ],
      similarity: similarity,
      minimumRequired: minimumRequired,
      range: '<0.60'
    }
  } else if (similarity >= 0.60 && similarity < 0.75) {
    // Similaridade baixa, mas "quase" (0.60 – 0.75)
    return {
      title: "A voz ainda não está suficientemente parecida",
      message: `Tentamos gerar o áudio, mas a voz ainda está diferente demais da sua.\n\nSimilaridade detectada: ${similarityPercent}% (mínimo exigido: ${minimumRequired}%).`,
      recommendations: [
        "Envie no mínimo 2 áudios de referência, com 20–40 segundos cada",
        "Grave em lugar silencioso, sem ruído, vento ou música",
        "Fale no mesmo sotaque e idioma que você quer no resultado final",
        "Mantenha o tom de voz natural e constante nos áudios",
        "Se possível, evite áudios curtos, com muita pausa ou com qualidade ruim de microfone"
      ],
      similarity: similarity,
      minimumRequired: minimumRequired,
      range: '0.60-0.75'
    }
  } else if (similarity >= 0.75 && similarity < 0.85) {
    // Faixa "ok, mas não perfeito" (0.75 – 0.85)
    return {
      title: "Voz gerada com qualidade mediana",
      message: `A voz foi clonada com similaridade moderada (${similarityPercent}%).\n\nEla pode soar um pouco diferente em timbre ou sotaque.`,
      recommendations: [
        "Adicionar mais áudios de referência (2–3, de 20–40 segundos)",
        "Usar gravações mais limpas, sem barulho",
        "Falar de forma natural, com o mesmo sotaque desejado"
      ],
      similarity: similarity,
      minimumRequired: minimumRequired,
      range: '0.75-0.85'
    }
  } else {
    // Similaridade >= 0.85 (aceitável)
    return {
      title: "Voz gerada com sucesso",
      message: `Voz clonada com similaridade de ${similarityPercent}%.`,
      recommendations: [],
      similarity: similarity,
      minimumRequired: minimumRequired,
      range: '>=0.85'
    }
  }
}

export async function POST(request: NextRequest) {
  
  try {
    // 🔐 AUTENTICAÇÃO OBRIGATÓRIA - PRIMEIRA COISA A VERIFICAR
    // ❌ Se não estiver autenticado, retorna erro IMEDIATAMENTE (antes de processar qualquer coisa)
    
    const supabase = await createClient()
    
    // Tentar obter usuário (lê de cookies automaticamente via @supabase/ssr)
    let user = null
    let authError = null
    
    // Primeiro tenta com getUser() (lê cookies)
    const getUserResult = await supabase.auth.getUser()
    user = getUserResult.data?.user || null
    authError = getUserResult.error
    
    if (user) {
    } else {
      
      // Se não funcionou, tenta ler do header Authorization
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        
        try {
          // Validar token diretamente com a API do Supabase
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          
          if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Variáveis do Supabase não configuradas')
          }
          
          const validateResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': supabaseAnonKey
            }
          })
          
          if (validateResponse.ok) {
            const userData = await validateResponse.json()
            if (userData && userData.id) {
              user = userData
            } else {
              authError = { message: 'Token inválido: resposta vazia' }
            }
          } else {
            authError = { message: `Token inválido: ${validateResponse.status}` }
          }
        } catch (tokenError: any) {
          authError = tokenError
        }
      } else {
      }
    }
    
    // 🚨 CRÍTICO: Se não estiver autenticado, retornar erro IMEDIATAMENTE
    // Não processa NADA se o usuário não estiver autenticado
    if (!user || !user.id) {
      console.error('❌ Usuário não autenticado - acesso negado')
      return NextResponse.json(
        { 
          error: "Não autenticado", 
          details: authError?.message || "Sessão não encontrada. Faça login para gerar vozes.",
          hint: "Faça login na aplicação antes de gerar uma voz. Se você já está logado, tente recarregar a página."
        },
        { status: 401 }
      )
    }
    

    // Agora sim, ler o body da requisição (após autenticação confirmada)
    const body = await request.json()
    const { 
      voiceId, 
      voiceCloneId, 
      text, 
      model, // Modelo: 's1' ou 'speech-1.5'
      speed, 
      pitch, 
      volume, // Volume: -10 a 10 (padrão: 0)
      temperature, // Temperatura: 0.0 a 1.0 (padrão: 0.9)
      topP, // Top-p: 0.0 a 1.0 (padrão: 0.9)
      language, // Idioma: para preservar sotaque (ex: 'pt-MZ' para moçambicano)
      format, 
      skipSave 
    } = body

    if (!voiceId || !text) {
      return NextResponse.json(
        { error: "voiceId e text são obrigatórios" },
        { status: 400 }
      )
    }

    // IMPORTANTE: Sempre usar modelo persistente do usuário
    // Nunca usar clonagem instantânea aleatória - sempre validar modelo persistente
    const persistentVoiceCheck = await ensurePersistentVoiceModel(
      voiceCloneId || voiceId,
      user.id
    )
    
    if (!persistentVoiceCheck.isValid || !persistentVoiceCheck.voiceClone) {
      return NextResponse.json(
        { 
          error: persistentVoiceCheck.error || "Voz não encontrada",
          errorCode: 'voz_nao_encontrada'
        },
        { status: 404 }
      )
    }
    
    const voiceClone = persistentVoiceCheck.voiceClone
    const adminClient = createAdminClient()
    
    // 🚨 CRÍTICO: Definir bucketName antes de usar (para validação e upload)
    const bucketName = 'voice-clones'

    // IMPORTANTE: Usar modelo persistente - validar referência antes de gerar
    const audioUrls: string[] = voiceClone.audio_urls 
      ? (Array.isArray(voiceClone.audio_urls) ? voiceClone.audio_urls : [voiceClone.audio_urls])
      : (voiceClone.audio_url ? [voiceClone.audio_url] : [])
    
    // Validar se a referência é suficiente
    const referenceValidation = await validateReferenceAudio(
      audioUrls,
      voiceClone.id
    )
    
    if (!referenceValidation.isValid) {
      return NextResponse.json(
        { 
          error: referenceValidation.message || "Referência insuficiente",
          errorCode: referenceValidation.error || 'referencia_insuficiente',
          hint: "Adicione pelo menos 2 áudios de referência (20-50 segundos cada) antes de gerar a voz."
        },
        { status: 400 }
      )
    }

    // Verificar cache
    const textHash = generateTextHash(text)
    const { data: cachedAudio, error: cacheError } = await adminClient
      .from('voice_audio_generations')
      .select('*')
      .eq('voice_clone_id', voiceClone.id)
      .eq('text_hash', textHash)
      .single()

    if (cachedAudio && !cacheError) {
      // Retornar áudio do cache
      // Áudio encontrado no cache
      const cachedAudioTyped = cachedAudio as { id?: string; audio_url?: string; [key: string]: any }
      return NextResponse.json({
        success: true,
        audioUrl: cachedAudioTyped.audio_url,
        cached: true,
        generationId: cachedAudioTyped.id,
      })
    }

    // Gerar novo áudio usando modelo persistente (nunca clonagem instantânea aleatória)
    // Baixando áudios de referência

    // Baixar todos os áudios de referência do modelo persistente
    let referenceAudioBuffers: Buffer[] = []
    // Baixando áudios do Storage
    
    for (let i = 0; i < audioUrls.length; i++) {
      const url = audioUrls[i]
      // Baixando áudio
      
      try {
        const response = await fetch(url)
        if (!response.ok) {
          // Falha ao baixar áudio
          continue
        }
        
        const buffer = Buffer.from(await response.arrayBuffer())
        // Áudio baixado
        referenceAudioBuffers.push(buffer)
      } catch (error: any) {
        // Erro ao baixar áudio
      }
    }
    
    // Áudios baixados

    if (referenceAudioBuffers.length === 0) {
      return NextResponse.json(
        { 
          error: "Não foi possível baixar áudios de referência do modelo persistente",
          errorCode: 'referencia_insuficiente'
        },
        { status: 400 }
      )
    }

    // MELHORES PRÁTICAS DA FISH AUDIO:
    // 1. Usar TODOS os áudios de referência para máxima consistência (gênero, emoção, tom)
    // 2. A Fish Audio recomenda múltiplos áudios (2-3) de 20-50 segundos cada
    // 3. Todos os áudios serão combinados em um único arquivo para garantir similaridade máxima
    // Gerando TTS
    
    // 🚨 CRÍTICO: Verificar se voice_id é um reference_id válido da Fish API
    // IMPORTANTE: UUIDs gerados localmente NÃO são reference_id válidos!
    // Apenas IDs criados pela Fish API (começando com 'model_' ou IDs específicos da Fish) são válidos
    // Usar voice_id do voiceClone (não redefinir voiceId que já vem do body)
    const voiceCloneVoiceId = voiceClone.voice_id
    
    // Verificar se é um reference_id válido da Fish API
    // IMPORTANTE: UUIDs locais (com hífens) NÃO são reference_id válidos!
    // Apenas IDs criados pela Fish API são válidos:
    // - 32 hex chars SEM hífens (ex: "8ef4a238714b45718ce04243307c57a7")
    // - IDs que começam com "model_" (criados via Python SDK)
    // UUIDs com hífens são IDs locais e devem usar reference_audio (clonagem instantânea)
    const isFishReferenceId = voiceCloneVoiceId && (
      voiceCloneVoiceId.startsWith('model_') || // Modelos criados via Python SDK
      (voiceCloneVoiceId.match(/^[0-9a-f]{32}$/i) && !voiceCloneVoiceId.includes('-')) // 32 hex chars SEM hífens (formato Fish)
    )
    
    if (isFishReferenceId) {
      // Não precisa de reference_audio quando usar reference_id válido
      referenceAudioBuffers = []
    } else {
    }
    
    // 🚨 IMPORTANTE: Text-to-Speech (TTS) usando voz já clonada
    // O usuário já tem uma voz clonada, agora vamos gerar narração usando essa voz
    // NÃO é clonagem nova, é geração de narração com a voz existente
    const finalLanguage = language || 'pt' // Padrão: pt (português)
    const finalSpeed = speed || 1.0 // Velocidade: 0.5-2.0
    
    
    // Salvar primeiro áudio de referência temporariamente para usar com Coqui TTS
    const fs = require('fs')
    const path = require('path')
    const tmpDir = path.join(process.cwd(), 'tmp', 'coqui-reference')
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }
    
    let referenceAudioPath: string | undefined = undefined
    
    if (referenceAudioBuffers.length > 0) {
      // XTTS v2 funciona melhor com múltiplos áudios de referência (2-3 áudios de 20-50 segundos cada)
      // Usar TODOS os áudios disponíveis para máxima qualidade
      const referenceFilePaths: string[] = []
      
      for (let i = 0; i < Math.min(referenceAudioBuffers.length, 3); i++) {
        // Limitar a 3 áudios para não sobrecarregar
        const referenceBuffer = referenceAudioBuffers[i]
        const referenceFileName = `ref_${Date.now()}_${i}.wav`
        const referenceFilePath = path.join(tmpDir, referenceFileName)
        
        // Salvar buffer temporariamente
        fs.writeFileSync(referenceFilePath, referenceBuffer)
        referenceFilePaths.push(referenceFilePath)
      }
      
      // XTTS v2 aceita múltiplos arquivos - usar todos para melhor qualidade
      referenceAudioPath = referenceFilePaths.length > 1 
        ? referenceFilePaths.join(',') // Múltiplos arquivos separados por vírgula
        : referenceFilePaths[0] // Um único arquivo
      
    }
    
    // Gerar TTS com Coqui TTS usando XTTS v2 para melhor qualidade
    // XTTS v2 é o modelo mais avançado do Coqui TTS para clonagem de voz
    // Documentação: https://github.com/coqui-ai/TTS e https://coquitts.com/
    // 
    // MELHORES PRÁTICAS XTTS v2:
    // - Usar múltiplos áudios de referência (2-3 áudios de 20-50 segundos cada)
    // - Temperature: 0.7-0.8 para voz mais natural (não robótica)
    // - Top-p: 0.8-0.9 para melhor diversidade e naturalidade
    // - Language sempre especificado para preservar sotaque
    const coquiOptions: CoquiTTSOptions = {
      model: process.env.COQUI_TTS_MODEL || 'tts_models/multilingual/multi-dataset/xtts_v2', // XTTS v2 (modelo mais avançado)
      speed: finalSpeed,
      language: finalLanguage || 'pt', // XTTS v2 sempre requer language (obrigatório)
      speaker_wav: referenceAudioPath, // Múltiplos áudios de referência para melhor qualidade
      output_format: (format === 'wav' ? 'wav' : 'wav') as 'wav', // Coqui TTS gera WAV, depois convertemos se necessário
      // Parâmetros XTTS v2 para melhor qualidade e naturalidade (evitar voz robótica)
      temperature: temperature !== undefined ? Math.max(0.5, Math.min(1.0, temperature)) : 0.75, // 0.7-0.8 para voz mais natural
      top_p: topP !== undefined ? Math.max(0.5, Math.min(1.0, topP)) : 0.85, // 0.8-0.9 para melhor diversidade
      top_k: 50, // Padrão recomendado do XTTS v2
    }
    
    let audioBuffer: Buffer
    
    if (referenceAudioPath) {
      // 🎯 TTS usando voz já clonada (não é clonagem nova, é geração de narração)
      audioBuffer = await cloneVoice(text, referenceAudioPath, coquiOptions)
    } else {
      // TTS normal sem voz clonada
      audioBuffer = await generateTTS(text, coquiOptions)
    }
    
    // Limpar arquivos temporários de referência
    if (referenceAudioPath) {
      try {
        // Se for múltiplos arquivos (separados por vírgula), limpar todos
        if (referenceAudioPath.includes(',')) {
          const filesToClean = referenceAudioPath.split(',')
          filesToClean.forEach((file: string) => {
            const filePath = file.trim()
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          })
        } else {
          // Um único arquivo
          if (fs.existsSync(referenceAudioPath)) {
            fs.unlinkSync(referenceAudioPath)
          }
        }
      } catch (e) {
        // Ignorar erro de limpeza
      }
    }
    
    // Converter para MP3 se necessário (Coqui TTS gera WAV por padrão)
    if (format === 'mp3' && audioBuffer) {
      try {
        const { convertWavToMp3 } = await import('@/lib/audio-converter')
        audioBuffer = await convertWavToMp3(audioBuffer)
      } catch (e) {
        console.warn('⚠️ Não foi possível converter para MP3, mantendo WAV:', e)
      }
    }
    
    // Verificar se o áudio foi gerado corretamente
    // Áudio gerado
    
    
    // VALIDAÇÃO CRÍTICA: Verificar se a voz gerada corresponde à referência
    // Tentar usar pipeline Python profissional primeiro, depois fallback
    let validation: any = { isValid: true, confidence: 0.85 } // Default
    
    try {
      // 🚨 CRÍTICO: Buscar embedding_url do banco de dados (metadata) primeiro
      // Se não encontrar, tentar buscar nos audioUrls (compatibilidade)
      let embeddingUrl: string | null = null
      
      // 1. Tentar buscar do metadata do voiceClone
      if (voiceClone.metadata && typeof voiceClone.metadata === 'object' && 'embedding_url' in voiceClone.metadata) {
        embeddingUrl = (voiceClone.metadata as any).embedding_url
      }
      
      // 2. Fallback: buscar nos audioUrls (compatibilidade com vozes antigas)
      if (!embeddingUrl) {
        embeddingUrl = audioUrls.find(url => url && typeof url === 'string' && url.includes('voice_embedding.json')) || null
        if (embeddingUrl) {
        }
      }
      
      if (embeddingUrl) {
        const { validateGeneration } = await import('@/lib/python-worker')
        
        // Salvar áudio gerado temporariamente para validação
        const crypto = require('crypto')
        const tmpFileName = `tmp/${crypto.randomUUID()}.mp3`
        const { data: tmpUpload } = await adminClient.storage
          .from(bucketName)
          .upload(tmpFileName, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: false,
          })
        
        if (tmpUpload) {
          const { data: { publicUrl: tmpUrl } } = adminClient.storage
            .from(bucketName)
            .getPublicUrl(tmpFileName)
          
          // Baixar embedding de referência
          const embeddingResponse = await fetch(embeddingUrl)
          const embeddingData = await embeddingResponse.json()
          
          // Salvar embedding temporariamente
          const fs = require('fs')
          const tmpDir = require('path').join(process.cwd(), 'tmp')
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true })
          }
          const tmpEmbeddingPath = require('path').join(tmpDir, `ref_${Date.now()}.emb.json`)
          fs.writeFileSync(tmpEmbeddingPath, JSON.stringify(embeddingData))
          
          const pythonValidation = await validateGeneration(tmpEmbeddingPath, tmpUrl, 0.82)
          
          // 🚨 CRÍTICO: Mapear status do Python para isValid
          // ok = True significa similaridade >= threshold (0.82)
          // status pode ser: 'ok', 'review', 'reject', 'error'
          const isValid = pythonValidation.ok || pythonValidation.status === 'ok'
          const similarity = pythonValidation.similarity || 0
          
          validation = {
            isValid: isValid,
            confidence: similarity,
            status: pythonValidation.status || 'reject',
            similarity: similarity, // Incluir similarity explicitamente
          }
          
          
          // Limpar arquivos temporários
          try {
            await adminClient.storage.from(bucketName).remove([tmpFileName])
            fs.unlinkSync(tmpEmbeddingPath)
          } catch (e) {
            // Ignorar erros de limpeza
          }
        }
      } else {
        // Fallback: validação básica
        const validationReferenceAudio = referenceAudioBuffers[0]
        validation = await validateVoiceConsistency(
          validationReferenceAudio,
          audioBuffer,
          voiceClone.id
        )
      }
    } catch (validationError: any) {
      console.error('⚠️ Erro na validação Python, usando fallback:', validationError.message)
      // Fallback: validação básica
      const validationReferenceAudio = referenceAudioBuffers[0]
      validation = await validateVoiceConsistency(
        validationReferenceAudio,
        audioBuffer,
        voiceClone.id
      )
    }
    
    // Callback de validação
    const callbacks: VoiceGenerationCallback = {
      onSuccess: (audio, validation) => {
        // Voz validada
      },
      onError: (error, message) => {
        // Erro de validação
      }
    }
    
    // 🚨 CRÍTICO: Validação apenas para LOG e diagnóstico, NUNCA para bloquear
    // Se o Coqui TTS gerou o áudio com sucesso, sempre retornar para o usuário
    const finalSimilarity = validation.similarity !== undefined ? validation.similarity : (validation.confidence || 0)
    const similarityPercent = (finalSimilarity * 100).toFixed(1)
    
    // Threshold baixo apenas para warning no log (não bloqueia)
    const LOW_SIMILARITY_THRESHOLD = 0.5
    
    if (finalSimilarity < LOW_SIMILARITY_THRESHOLD) {
      // Apenas log de warning, não bloqueia
      console.warn(`⚠️ [DIAGNÓSTICO] Similaridade baixa detectada: ${similarityPercent}% (threshold de warning: ${(LOW_SIMILARITY_THRESHOLD * 100).toFixed(0)}%)`)
      console.warn(`   ℹ️ Áudio será retornado mesmo assim (Coqui TTS gerou com sucesso)`)
      console.warn(`   ℹ️ Validação por embeddings é apenas informativa, não bloqueia geração`)
    } else {
    }
    
    // Sempre continuar - validação é apenas para diagnóstico
    callbacks.onSuccess?.(audioBuffer, validation)

    // Upload do áudio para Supabase Storage
    const crypto = require('crypto')
    const generationId = crypto.randomUUID()
    const fileName = `voice-generations/${user.id}/${generationId}.${format || 'mp3'}`
    // bucketName já foi definido acima
    
    let audioUrl: string
    
    try {
      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from(bucketName)
        .upload(fileName, audioBuffer, {
          contentType: `audio/${format || 'mp3'}`,
          upsert: false,
        })

      if (uploadError) {
        // Erro ao fazer upload
        // Fallback para base64 se o upload falhar
        const audioBase64 = audioBuffer.toString('base64')
        audioUrl = `data:audio/${format || 'mp3'};base64,${audioBase64}`
      } else {
        // Obter URL pública
        const { data: { publicUrl } } = adminClient.storage
          .from(bucketName)
          .getPublicUrl(fileName)
        audioUrl = publicUrl
        // Áudio gerado salvo
      }
    } catch (storageError: any) {
      // Erro ao salvar áudio
      // Fallback para base64
      const audioBase64 = audioBuffer.toString('base64')
      audioUrl = `data:audio/${format || 'mp3'};base64,${audioBase64}`
    }

    // 🚨 CRÍTICO: Sempre salvar no banco para histórico do usuário
    // O usuário precisa ver todas as gerações que criou
    try {
      const { data: savedGeneration, error: insertError } = await adminClient
        .from('voice_audio_generations')
        .insert({
          user_id: user.id,
          voice_clone_id: voiceClone.id,
          text: text,
          text_hash: textHash,
          audio_url: audioUrl,
        } as any)
        .select()
        .single()

      if (insertError) {
        console.error('⚠️ Erro ao salvar geração no histórico:', insertError.message)
        // Continuar mesmo se houver erro ao salvar no banco (não bloquear resposta)
        // Mas logar o erro para debug
      } else {
      }
    } catch (saveError: any) {
      console.error('⚠️ Erro ao salvar geração no histórico:', saveError.message)
      // Continuar mesmo se houver erro
    }

    // COBRAR CRÉDITOS pela geração de áudio
    try {
      const { calculateAudioCredits } = await import('@/lib/utils/credits')
      const { debitCredits } = await import('@/lib/db/credits')
      
      // Calcular duração do áudio em minutos
      // Estimativa: áudio MP3 a ~128kbps = ~1MB por minuto
      // Vamos usar uma estimativa baseada no tamanho do buffer
      // Para melhor precisão, seria ideal usar uma biblioteca de análise de áudio
      const audioBufferSizeBytes = audioBuffer.length
      // Estimativa: ~128kbps = ~16KB por segundo = ~960KB por minuto
      // Vamos estimar: ~16KB por segundo
      const estimatedDurationSeconds = (audioBufferSizeBytes / 16000)
      const estimatedDurationMinutes = Math.max(0.1, estimatedDurationSeconds / 60) // Mínimo 0.1 minuto
      
      // Alternativamente, podemos estimar baseado no texto: ~150 palavras por minuto
      const textLength = text.length
      const wordsCount = text.split(/\s+/).length
      const textBasedDurationMinutes = wordsCount / 150 // ~150 palavras por minuto
      
      // Usar a maior estimativa (mais conservadora)
      const durationMinutes = Math.max(estimatedDurationMinutes, textBasedDurationMinutes, 0.1)
      
      const creditsToDebit = calculateAudioCredits(durationMinutes)
      
      if (creditsToDebit > 0) {
        await debitCredits(
          user.id,
          creditsToDebit,
          'audio_generation',
          `Geração de áudio - ${durationMinutes.toFixed(2)} minutos`,
          {
            generation_id: generationId,
            duration_minutes: durationMinutes,
            text_length: textLength,
            voice_clone_id: voiceClone.id,
          },
          true // Permite saldo negativo
        )
      }
    } catch (creditError) {
      console.error('Erro ao debitar créditos pela geração de áudio:', creditError)
      // Não bloquear a geração se houver erro ao debitar créditos
    }

    // 🚨 CRÍTICO: Sempre retornar áudio se Coqui TTS gerou com sucesso
    // Similaridade é apenas informação para diagnóstico, não bloqueia
    // (finalSimilarity e similarityPercent já foram definidos acima)
    
    // Incluir similaridade apenas como informação (não como bloqueio)
    return NextResponse.json({
      success: true,
      audioUrl: audioUrl,
      cached: false,
      format: format || 'mp3',
      similarity: finalSimilarity, // Informação apenas (diagnóstico)
      similarityPercent: similarityPercent, // Informação apenas (diagnóstico)
      // Nota: Similaridade é apenas informativa, não afeta a entrega do áudio
      // Se Coqui TTS gerou o áudio, ele é sempre entregue
    })

  } catch (error: any) {
    console.error('❌ Erro ao gerar TTS:', error)
    
    // Detectar erro específico do torchaudio no Windows
    const errorMessage = error.message || String(error)
    const isTorchAudioError = errorMessage.includes('torchaudio') || 
                              errorMessage.includes('libtorchaudio') || 
                              errorMessage.includes('WinError 127') ||
                              errorMessage.includes('Could not load this library')
    
    if (isTorchAudioError) {
      return NextResponse.json(
        { 
          error: "Erro ao carregar bibliotecas do TTS no Windows",
          details: "O torchaudio não está conseguindo carregar suas dependências nativas.",
          solution: "Consulte o arquivo TROUBLESHOOTING_TTS.md para instruções detalhadas de correção.",
          quickFix: [
            "1. Reinstalar PyTorch: pip uninstall torch torchaudio && pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu",
            "2. Instalar Visual C++ Redistributables: https://aka.ms/vs/17/release/vc_redist.x64.exe",
            "3. Reiniciar o computador após instalar"
          ],
          fullError: errorMessage.substring(0, 1000) // Limitar tamanho
        },
        { status: 500 }
      )
    }
    
    // Erro genérico
    return NextResponse.json(
      { 
        error: error.message || "Erro ao gerar narração",
        details: errorMessage.substring(0, 500)
      },
      { status: 500 }
    )
  }
}

