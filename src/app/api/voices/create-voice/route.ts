import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  
  try {
    // 🔐 AUTENTICAÇÃO OBRIGATÓRIA: Apenas usuários autenticados podem criar vozes
    // ❌ NÃO criamos usuários temporários - se não estiver autenticado, retorna erro 401
    const supabase = await createClient()
    
    // Tentar autenticar via cookies (método padrão)
    const getUserResult = await supabase.auth.getUser()
    let user = getUserResult.data?.user || null
    let authError = getUserResult.error
    
    if (user) {
    } else {
      if (authError) {
      }
      
      // Se não funcionou, tenta ler do header Authorization
      const authHeader = request.headers.get('authorization')
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        
        try {
          // Validar token diretamente com a API do Supabase
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          
          if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Variáveis do Supabase não configuradas (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
          }
          
          // Fazer requisição direta para a API do Supabase para validar token
          const validateResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json'
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
            const errorText = await validateResponse.text()
            authError = { message: `Token inválido: ${validateResponse.status}` }
          }
        } catch (tokenError: any) {
          authError = tokenError
        }
      }
    }
    
    // 🚨 CRÍTICO: Se não estiver autenticado, retornar erro 401
    // ❌ NÃO criamos usuários temporários - o usuário DEVE estar autenticado
    if (!user || !user.id) {
      console.error('❌ Usuário não autenticado - acesso negado')
      return NextResponse.json(
        { 
          error: "Não autenticado", 
          details: authError?.message || "Sessão não encontrada. Faça login para criar vozes.",
          hint: "Faça login na aplicação antes de criar uma voz. Se você já está logado, tente recarregar a página."
        },
        { status: 401 }
      )
    }
    
    const userId = user.id
    
    const formData = await request.formData()
    const audioCount = parseInt(formData.get("audioCount") as string || "1")
    const name = formData.get("name") as string | null
    const description = formData.get("description") as string | null
    const testText = formData.get("testText") as string | null // Texto de teste opcional

    // Receber múltiplos áudios (2-3 arquivos)
    const audioFiles: File[] = []
    for (let i = 0; i < audioCount; i++) {
      const file = formData.get(`audio${i}`) as File | null
      if (file && file.size > 1000) { // Filtrar arquivos vazios (< 1KB)
        audioFiles.push(file)
      } else if (file) {
        console.warn(`⚠️ Áudio ${i + 1} ignorado (muito pequeno):`, file.name, `(${(file.size / 1024).toFixed(2)} KB)`)
      }
    }
    

    // Validar quantidade (2-3 arquivos válidos)
    if (audioFiles.length < 2) {
      console.error('❌ Menos de 2 arquivos válidos recebidos:', audioFiles.length)
      return NextResponse.json(
        { error: "Envie pelo menos 2 arquivos de áudio válidos (mínimo 1KB cada) para melhor treinamento" },
        { status: 400 }
      )
    }

    if (audioFiles.length > 3) {
      console.error('❌ Mais de 3 arquivos recebidos:', audioFiles.length)
      return NextResponse.json(
        { error: "Envie no máximo 3 arquivos de áudio" },
        { status: 400 }
      )
    }
    
    
    // Ler transcrições se fornecidas
    const transcripts: string[] = []
    const transcriptsJson = formData.get("transcripts") as string | null
    if (transcriptsJson) {
      try {
        const parsed = JSON.parse(transcriptsJson)
        if (Array.isArray(parsed)) {
          transcripts.push(...parsed)
        }
      } catch (e) {
        console.warn('⚠️ Erro ao parsear transcrições:', e)
      }
    }
    

    // Validar cada arquivo
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg']
    const maxSize = 25 * 1024 * 1024 // 25MB

    for (const audioFile of audioFiles) {
      // Validar tipo
      if (!allowedTypes.includes(audioFile.type)) {
        return NextResponse.json(
          { error: `Tipo de arquivo não suportado: ${audioFile.name}. Use: WAV, MP3, WEBM ou OGG` },
          { status: 400 }
        )
      }

      // Validar tamanho
      if (audioFile.size > maxSize) {
        return NextResponse.json(
          { error: `Arquivo muito grande: ${audioFile.name}. Tamanho máximo: 25MB` },
          { status: 400 }
        )
      }
    }

    // PIPELINE PROFISSIONAL: Usar worker Python para pré-processamento e extração de embeddings
    // 1. Salvar áudios no Supabase Storage primeiro
    // 2. Processar com pipeline Python (pré-processamento + embeddings)
    // 3. Salvar embeddings e metadados
    // 4. Usar para geração futura

    // 1. Salvar múltiplos áudios no Supabase Storage
    // Salvando áudios no Supabase Storage
    
    // Gerar UUID para identificar a voz
    const crypto = require('crypto')
    const voiceId = crypto.randomUUID()
    
    // Upload de todos os áudios
    const audioUrls: string[] = []
    const bucketName = 'voice-clones'
    const USE_SUPABASE_STORAGE = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    
    
    // 🚨 CRÍTICO: Supabase Storage é obrigatório
    if (!USE_SUPABASE_STORAGE) {
      console.error('❌ Supabase Storage não configurado')
      return NextResponse.json(
        { 
          error: "Configuração incompleta",
          details: "Supabase Storage não está configurado",
          hint: "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local e reinicie o servidor"
        },
        { status: 500 }
      )
    }
    
    // Usar Supabase Storage
    try {
        let adminClient
        try {
          adminClient = createAdminClient()
        } catch (adminError: any) {
          // Se não conseguir criar admin client, retornar erro
          console.error('❌ Erro ao criar admin client:', adminError.message)
          return NextResponse.json(
            { 
              error: "Erro de configuração",
              details: adminError.message,
              hint: "Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada corretamente no .env.local"
            },
            { status: 500 }
          )
        }
        
        if (!adminClient) {
          // Se não tem admin client, já processamos via fallback acima
          // Continuar para processamento Python
        } else {
          for (let i = 0; i < audioFiles.length; i++) {
          const audioFile = audioFiles[i]
          
          const audioBuffer = await audioFile.arrayBuffer()
          const audioBytes = Buffer.from(audioBuffer)
          
          const fileExtension = audioFile.name.split('.').pop() || 'wav'
          // ⚠️ IMPORTANTE: fileName deve ser relativo ao bucket (sem incluir o nome do bucket)
          const fileName = `${userId}/${voiceId}/audio${i + 1}.${fileExtension}`
          
          
          // Upload do arquivo
          const { data: uploadData, error: uploadError } = await adminClient.storage
            .from(bucketName)
            .upload(fileName, audioBytes, {
              contentType: audioFile.type,
              upsert: false,
            })
          

          if (uploadError) {
            console.error(`❌ Erro ao fazer upload do áudio ${i + 1}:`, uploadError.message)
            
            if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('Internal')) {
              return NextResponse.json(
                { 
                  error: "Bucket não configurado",
                  details: "Crie um bucket chamado 'voice-clones' no Supabase Storage",
                  hint: "Vá em Storage → Create bucket → Nome: voice-clones → Público: Não"
                },
                { status: 500 }
              )
            }
            
            // Erro ao fazer upload
            return NextResponse.json(
              { 
                error: "Erro ao fazer upload do áudio",
                details: uploadError.message,
                hint: "Verifique se o Supabase Storage está configurado corretamente"
              },
              { status: 500 }
            )
          }

          // Obter URL pública do arquivo
          const { data: { publicUrl } } = adminClient.storage
            .from(bucketName)
            .getPublicUrl(fileName)
          
            audioUrls.push(publicUrl)
          }

        }
    } catch (storageError: any) {
      console.error('❌ Erro geral no Supabase Storage:', storageError.message)
      return NextResponse.json(
        { 
          error: "Erro ao salvar áudios no storage",
          details: storageError.message,
          hint: "Verifique se o Supabase Storage está configurado e funcionando corretamente"
        },
        { status: 500 }
      )
    }

    // PIPELINE PROFISSIONAL: Processar com Python
    let embeddingUrl: string | null = null // 🚨 CRÍTICO: Variável para salvar URL do embedding
    try {
      const { processMultipleAudios } = await import('@/lib/python-worker')
      
      const outputDir = `${userId}/${voiceId}/processed`
      const pipelineResult = await processMultipleAudios(audioUrls, outputDir)
      
      
      // Salvar embedding combinado no storage (se Supabase estiver configurado)
      const crypto = require('crypto')
      const embeddingJson = JSON.stringify({
        embedding: pipelineResult.combinedEmbedding.embedding,
        shape: pipelineResult.combinedEmbedding.shape,
        metadata: pipelineResult.processedAudios.map(a => a.metadata)
      })
      
      if (USE_SUPABASE_STORAGE) {
        try {
          let adminClient
          try {
            adminClient = createAdminClient()
          } catch (e) {
            adminClient = null
          }
          
          if (adminClient) {
            const embeddingFileName = `${userId}/${voiceId}/voice_embedding.json`
            const embeddingBuffer = Buffer.from(embeddingJson, 'utf-8')
            
            const { data: embeddingUpload, error: embeddingError } = await adminClient.storage
              .from(bucketName)
              .upload(embeddingFileName, embeddingBuffer, {
                contentType: 'application/json',
                upsert: false,
              })
            
            if (!embeddingError) {
              const { data: { publicUrl } } = adminClient.storage
                .from(bucketName)
                .getPublicUrl(embeddingFileName)
              
              embeddingUrl = publicUrl // 🚨 CRÍTICO: Salvar URL do embedding
            }
          }
        } catch (embeddingStorageError: any) {
          // Em modo desenvolvimento, continuar sem salvar no storage
        }
      } else {
        // O embedding será usado para validação de qualidade da clonagem
      }
      
    } catch (pythonError: any) {
      console.error('⚠️ Erro no pipeline Python (continuando sem ele):', pythonError.message)
      // Continuar mesmo se Python falhar - Coqui TTS pode funcionar sem embeddings
    }

    // 🚨 CRÍTICO: Coqui TTS não precisa criar modelo externo
    // Os áudios de referência serão usados diretamente na geração

    // Usar o primeiro áudio como URL principal (para compatibilidade)
    const audioUrl = audioUrls[0] || null

    // Filtrar apenas URLs válidas (não data URLs) - precisa ser definido antes de usar
    const validAudioUrls = audioUrls.filter(url => 
      url && 
      typeof url === 'string' &&
      !url.startsWith('data:') && 
      !url.includes('voice_embedding.json')
    )

    // 2. Salvar informações no banco de dados
    // Coqui TTS usa os áudios de referência diretamente, não precisa criar modelo externo
    // Armazenar todas as URLs dos áudios em JSON array (usaremos todos para melhor clonagem)
    
    // ✅ Usuário autenticado - pode prosseguir com a criação da voz
    // Não criamos usuários temporários - se chegou aqui, o usuário existe em auth.users
    
    let savedVoiceClone: any = null
    
    try {
      const adminClient = createAdminClient()
      
      // Preparar dados para inserção
      const insertData: any = {
        user_id: userId,
        name: name || `Voz ${new Date().toLocaleDateString('pt-BR')}`,
        voice_id: voiceId, // Voice ID local (Coqui TTS usa áudios diretamente)
        description: description || null,
        audio_url: audioUrl, // URL principal (primeiro áudio) para compatibilidade
        status: 'ready', // Pronto para usar
        metadata: {
          cloning_method: 'coqui_tts', // Usando Coqui TTS para clonagem
          audio_count: validAudioUrls.length,
          embedding_url: embeddingUrl || null, // 🚨 CRÍTICO: Salvar URL do embedding para validação futura
        }
      }
      
      // Adicionar audio_urls (array de URLs para múltiplos áudios de referência)
      // validAudioUrls já foi definido acima
      
      // Tentar adicionar audio_urls (a coluna existe, então podemos adicionar)
      if (validAudioUrls.length > 0) {
        // Garantir que é um array JSON válido
        insertData.audio_urls = validAudioUrls
      } else {
      }
      
      
      // Verificar se adminClient está funcionando
      try {
        // Tentar inserir com audio_urls primeiro
        const { data: voiceClone, error: dbError } = await adminClient
          .from('voice_clones')
          .insert(insertData)
          .select()
          .single()

        if (dbError) {
          console.error('❌ Erro ao salvar com audio_urls:')
          console.error('   Mensagem:', dbError.message)
          console.error('   Código:', dbError.code)
          console.error('   Detalhes:', dbError.details)
          console.error('   Hint:', dbError.hint)
          console.error('   Erro completo:', JSON.stringify(dbError, null, 2))
          
          // Verificar se é erro de foreign key (user_id não existe em auth.users)
          if (dbError.code === '23503' || dbError.message?.includes('foreign key constraint') || dbError.message?.includes('is not present in table')) {
            console.error('⚠️ Erro de foreign key detectado!')
            console.error('   O user_id não existe em auth.users')
            console.error('   Erro: não foi possível salvar no banco')
            
            // Erro de foreign key - usuário não existe em auth.users
            // Isso não deveria acontecer se a autenticação estiver funcionando corretamente
            return NextResponse.json(
              { 
                error: "Erro ao salvar voz clonada", 
                details: dbError.message,
                hint: "O user_id não existe em auth.users. Faça login novamente ou crie uma conta."
              },
              { status: 500 }
            )
          }
          
          // Verificar se é erro de RLS (Row Level Security)
          if (dbError.message?.includes('policy') || 
              dbError.message?.includes('RLS') ||
              dbError.message?.includes('permission') ||
              dbError.code === '42501') {
            console.error('⚠️ Erro de permissão/RLS detectado!')
            console.error('   O adminClient deveria bypassar RLS, mas pode estar com problema')
            console.error('   Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada corretamente')
          }
        
          // Se o erro for sobre coluna não existir, tentar sem ela
          const isColumnError = dbError.message?.includes('audio_urls') || 
                                dbError.message?.includes('metadata') ||
                                dbError.message?.includes('column') || 
                                dbError.message?.includes('does not exist') ||
                                dbError.message?.includes('schema cache') ||
                                dbError.code === '42703' || // PostgreSQL error code for undefined column
                                dbError.code === 'PGRST204' // PostgREST error for column not found
          
          if (isColumnError) {
            
            // Remover audio_urls e tentar novamente (sem metadata também)
            const { audio_urls, metadata, ...insertDataWithoutUrls } = insertData
            
            const { data: voiceCloneRetry, error: dbErrorRetry } = await adminClient
              .from('voice_clones')
              .insert(insertDataWithoutUrls)
              .select()
              .single()
            
            if (dbErrorRetry) {
              console.error('❌ Erro ao salvar sem audio_urls:', dbErrorRetry.message)
              return NextResponse.json(
                { 
                  error: "Erro ao salvar voz clonada", 
                  details: dbErrorRetry.message,
                  hint: "Verifique se a tabela voice_clones existe. Execute a migration 004_voice_cloning.sql se necessário."
                },
                { status: 500 }
              )
            }
            
            savedVoiceClone = voiceCloneRetry
            // Continuar para retornar sucesso no final
          } else {
            // Outro tipo de erro
            console.error('❌ Erro geral ao salvar:', dbError.message)
            
            // Mensagem de erro mais específica
            let errorHint = "Verifique os logs do servidor para mais detalhes"
            if (dbError.message?.includes('policy') || dbError.message?.includes('RLS')) {
              errorHint = "Erro de permissão. Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada e se as RLS policies estão corretas."
            } else if (dbError.message?.includes('audio_urls')) {
              errorHint = "A coluna audio_urls não existe. Execute: ALTER TABLE voice_clones ADD COLUMN IF NOT EXISTS audio_urls JSONB;"
            } else if (dbError.message?.includes('null value') || dbError.message?.includes('NOT NULL')) {
              errorHint = "Campo obrigatório faltando. Verifique se todos os campos necessários estão preenchidos."
            }
            
            return NextResponse.json(
              { 
                error: "Erro ao salvar voz clonada", 
                details: dbError.message || 'Erro desconhecido',
                hint: errorHint,
                errorCode: dbError.code,
                debug: {
                  hasAudioUrls: !!insertData.audio_urls,
                  audioUrlsCount: insertData.audio_urls?.length || 0,
                  userId: userId,
                  voiceId: voiceId
                }
              },
              { status: 500 }
            )
          }
        }
        
        // ✅ SUCESSO! voiceClone foi criado com sucesso
        if (voiceClone) {
          savedVoiceClone = voiceClone
        } else if (voiceCloneRetry) {
          savedVoiceClone = voiceCloneRetry
        } else {
          // Fallback: se voiceClone não foi definido (não deveria acontecer)
          console.error('❌ voiceClone não foi definido após insert bem-sucedido')
          return NextResponse.json(
            { 
              error: "Erro ao salvar voz clonada", 
              details: "Voz foi salva mas não foi possível retornar os dados",
              hint: "Verifique os logs do servidor"
            },
            { status: 500 }
          )
        }
        
      } catch (insertError: any) {
        console.error('❌ Erro ao executar insert:', insertError)
        return NextResponse.json(
          { 
            error: "Erro ao salvar voz clonada", 
            details: insertError.message || 'Erro desconhecido ao inserir',
            hint: "Verifique os logs do servidor. Pode ser problema de conexão com o banco de dados."
          },
          { status: 500 }
        )
      }

      
      // COBRAR 50 CRÉDITOS pela criação da voz
      try {
        const { debitCredits } = await import('@/lib/db/credits')
        
        const creditsRequired = 50
        const debitResult = await debitCredits(
          userId,
          creditsRequired,
          'voice_creation', // Nova categoria para criação de voz
          `Criação de voz clonada - ${savedVoiceClone.name || 'Voz sem nome'}`,
          {
            voice_clone_id: savedVoiceClone.id,
            voice_id: savedVoiceClone.voice_id,
            audio_count: audioFiles.length,
          },
          true // Permite saldo negativo
        )

        if (debitResult.success) {
          
          // Registrar atividade em user_activities
          try {
            await adminClient
              .from('user_activities')
              .insert({
                user_id: userId,
                type: 'VOICE_CREATE',
                credits_used: creditsRequired,
                metadata: {
                  voice_clone_id: savedVoiceClone.id,
                  voice_id: savedVoiceClone.voice_id,
                  action: 'voice_created',
                },
              })
              .catch((err) => {
                console.warn('⚠️ Erro ao registrar atividade (não crítico):', err.message)
              })
          } catch (activityError) {
            console.warn('⚠️ Erro ao registrar atividade (não crítico):', activityError)
          }
        } else {
          console.warn(`⚠️ Erro ao debitar créditos: ${debitResult.error}`)
          // Não bloquear a criação da voz se houver erro ao debitar créditos
        }
      } catch (creditError) {
        console.error('❌ Erro ao debitar créditos pela criação da voz:', creditError)
        // Não bloquear a criação da voz se houver erro ao debitar créditos
      }
      
      return NextResponse.json({
        success: true,
        voiceClone: {
          id: savedVoiceClone.id,
          name: savedVoiceClone.name,
          voiceId: savedVoiceClone.voice_id,
          description: savedVoiceClone.description,
          status: savedVoiceClone.status || 'ready',
          createdAt: savedVoiceClone.created_at,
        },
      })
    } catch (adminError: any) {
      console.error('❌ Erro ao criar admin client ou salvar no banco:', adminError)
      
      // Se o erro for sobre SERVICE_ROLE_KEY, dar mensagem mais clara
      if (adminError.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        return NextResponse.json(
          { 
            error: "Configuração incompleta",
            details: adminError.message,
            hint: "Configure SUPABASE_SERVICE_ROLE_KEY no .env.local e reinicie o servidor"
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "Erro ao salvar voz clonada", 
          details: adminError.message || 'Erro desconhecido',
          hint: "Verifique os logs do servidor"
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ Erro geral ao criar clone de voz:', error)
    console.error('❌ Stack trace:', error.stack)
    
    // Mensagem mais clara para erros de configuração
    if (error.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { 
          error: "Configuração incompleta",
          details: error.message,
          hint: "Configure SUPABASE_SERVICE_ROLE_KEY no .env.local e reinicie o servidor"
        },
        { status: 500 }
      )
    }
    
    // Erros de configuração do Coqui TTS
    if (error.message?.includes('COQUI_TTS') || error.message?.includes('TTS')) {
      return NextResponse.json(
        { 
          error: "Erro no Coqui TTS",
          details: error.message,
          hint: "Verifique se o Coqui TTS está instalado: pip install TTS"
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

