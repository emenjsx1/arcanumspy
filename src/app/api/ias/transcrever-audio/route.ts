import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDeepgramClient, DEFAULT_OPTIONS } from "@/lib/deepgram"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Tentar autenticar via cookies primeiro
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar, tentar via header Authorization
    if (authError || !user) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        const { data: { user: userFromToken } } = await tempClient.auth.getUser(token)
        if (userFromToken) {
          user = userFromToken
          authError = null
        }
      }
    }

    if (authError || !user) {
      return NextResponse.json(
        { 
          error: "Não autenticado",
          details: authError?.message || "Sessão não encontrada",
          hint: "Faça login novamente"
        },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = (formData.get('language') as string) || 'pt-BR'
    const model = (formData.get('model') as string) || 'nova-2'

    if (!audioFile) {
      return NextResponse.json(
        { error: "Arquivo de áudio é obrigatório" },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máximo 25MB)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    console.log(`🎤 Iniciando transcrição: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)}MB)`)

    // Converter arquivo para Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // Criar cliente Deepgram
    const deepgram = getDeepgramClient()

    // Determinar mimetype correto
    let mimetype = audioFile.type || 'audio/mpeg'
    
    // Corrigir mimetypes comuns
    if (!mimetype || mimetype === 'application/octet-stream') {
      const ext = audioFile.name.split('.').pop()?.toLowerCase()
      const mimeMap: Record<string, string> = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'webm': 'audio/webm',
        'ogg': 'audio/ogg',
        'm4a': 'audio/m4a',
        'aac': 'audio/aac',
        'flac': 'audio/flac',
      }
      mimetype = mimeMap[ext || ''] || 'audio/mpeg'
    }

    console.log(`🔍 Enviando para Deepgram: ${audioFile.name}, tipo: ${mimetype}, modelo: ${model}, idioma: ${language}`)

    // Deepgram SDK v4: FileSource é Buffer | Readable (não objeto!)
    // O mimetype é detectado automaticamente pelo Deepgram
    let result, deepgramError
    
    try {
      console.log(`📤 Enviando para Deepgram: buffer size=${audioBuffer.length} bytes, mimetype detectado=${mimetype}`)
      
      // Passar Buffer diretamente (FileSource = Buffer | Readable)
      const response = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer, // Buffer diretamente, não objeto!
        {
          model: model,
          language: language,
          smart_format: true,
          punctuate: true,
          diarize: false,
        }
      )
      
      result = response.result
      deepgramError = response.error
      
      if (deepgramError) {
        console.error('❌ Erro retornado pelo Deepgram:', deepgramError)
      } else {
        console.log('✅ Transcrição recebida do Deepgram')
      }
    } catch (error: any) {
      console.error('❌ Erro ao chamar Deepgram:', error)
      console.error('❌ Stack trace:', error.stack)
      console.error('❌ Detalhes:', {
        message: error.message,
        name: error.name,
        sourceType: typeof audioBuffer,
        bufferIsBuffer: Buffer.isBuffer(audioBuffer),
        bufferLength: audioBuffer.length,
        mimetype: mimetype
      })
      deepgramError = error
      result = null
    }

    if (deepgramError) {
      console.error('❌ Erro no Deepgram:', deepgramError)
      return NextResponse.json(
        { error: `Erro na transcrição: ${deepgramError.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    // Extrair transcrição do resultado
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0
    const duration = result?.metadata?.duration || 0
    const words = result?.results?.channels?.[0]?.alternatives?.[0]?.words || []

    if (!transcript) {
      return NextResponse.json(
        { error: "Não foi possível transcrever o áudio. Verifique se o arquivo contém áudio válido." },
        { status: 400 }
      )
    }

    console.log(`✅ Transcrição concluída: ${transcript.length} caracteres, confiança: ${(confidence * 100).toFixed(1)}%`)

    // Salvar no banco
    let dbRecord = null
    try {
      const { data, error: dbError } = await supabase
        .from('transcricoes_audio')
        .insert({
          user_id: user.id,
          nome_arquivo: audioFile.name,
          texto_transcrito: transcript,
          confianca: confidence,
          duracao: duration,
          idioma: language,
          modelo: model,
          status: 'concluido',
          palavras_count: words.length
        })
        .select()
        .single()

      if (dbError) {
        console.warn('⚠️ Erro ao salvar no banco (não crítico):', dbError.message)
      } else {
        dbRecord = data
      }
    } catch (dbError) {
      console.warn('⚠️ Tabela transcricoes_audio não existe ou erro ao salvar (não crítico)')
    }

    return NextResponse.json({
      success: true,
      transcricao: {
        id: dbRecord?.id || Date.now().toString(),
        arquivo: audioFile.name,
        texto: transcript,
        confianca: confidence,
        duracao: duration,
        idioma: language,
        modelo: model,
        palavras_count: words.length,
        palavras: words.map((w: any) => ({
          palavra: w.word,
          inicio: w.start,
          fim: w.end,
          confianca: w.confidence
        })),
        status: 'concluido',
        created_at: dbRecord?.created_at || new Date().toISOString()
      },
      message: "Transcrição concluída com sucesso"
    })
  } catch (error: any) {
    console.error('❌ Erro na transcrição:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar transcrição" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('transcricoes_audio')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar transcrições", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transcricoes: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

