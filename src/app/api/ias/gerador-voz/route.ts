import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const { texto, voz, velocidade, pitch, volume } = await request.json()

    if (!texto || !texto.trim()) {
      return NextResponse.json(
        { error: "Texto é obrigatório" },
        { status: 400 }
      )
    }

    // Extrair código de idioma da voz (ex: pt-BR-Standard-A -> pt-BR)
    const languageCode = voz.split('-').slice(0, 2).join('-')
    
    // Chamar Google Text-to-Speech API
    // Nota: Você precisará configurar a variável de ambiente GOOGLE_TTS_API_KEY
    const apiKey = process.env.GOOGLE_TTS_API_KEY
    
    if (!apiKey) {
      // Modo de desenvolvimento: retornar URL mock
      return NextResponse.json({
        success: true,
        audioUrl: `data:audio/mp3;base64,${Buffer.from('mock').toString('base64')}`,
        message: "Google TTS API key não configurada. Configure GOOGLE_TTS_API_KEY no .env"
      })
    }

    // Configurar parâmetros para Google TTS
    const ttsParams = {
      input: { text: texto },
      voice: {
        languageCode: languageCode,
        name: voz,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: velocidade || 1.0,
        pitch: pitch || 0.0,
        volumeGainDb: volume ? 20 * Math.log10(volume) : 0,
      }
    }

    // Fazer requisição para Google TTS
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ttsParams)
      }
    )

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.text()
      console.error('Google TTS Error:', errorData)
      return NextResponse.json(
        { error: "Erro ao gerar áudio com Google TTS" },
        { status: 500 }
      )
    }

    const ttsData = await ttsResponse.json()
    
    // Converter base64 para URL de áudio
    const audioBase64 = ttsData.audioContent
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`

    return NextResponse.json({
      success: true,
      audioUrl,
    })
  } catch (error: any) {
    console.error('Error in TTS generation:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar áudio" },
      { status: 500 }
    )
  }
}

