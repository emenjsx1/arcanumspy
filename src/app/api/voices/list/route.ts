import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Tentar obter usuário (lê de cookies automaticamente via @supabase/ssr)
    let user = null
    let authError = null
    
    // Primeiro tenta com getUser() (lê cookies)
    const getUserResult = await supabase.auth.getUser()
    user = getUserResult.data?.user || null
    authError = getUserResult.error
    
    // Se não funcionou, tenta ler do header Authorization
    if (!user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const tokenResult = await supabase.auth.getUser(token)
        user = tokenResult.data?.user || null
        authError = tokenResult.error
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { 
          error: "Não autenticado", 
          details: authError?.message || "Sessão não encontrada",
          hint: "Faça login novamente"
        },
        { status: 401 }
      )
    }

    // Buscar vozes do usuário
    const startTime = Date.now()
    
    try {
      const adminClient = createAdminClient()
      
      const queryStartTime = Date.now()
      const { data: voiceClones, error: dbError } = await adminClient
        .from('voice_clones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      const queryTime = Date.now() - queryStartTime

      if (dbError) {
        console.error('❌ [API /voices/list] Erro ao buscar vozes:', dbError)
        return NextResponse.json(
          { error: "Erro ao buscar vozes", details: dbError.message },
          { status: 500 }
        )
      }

      // OTIMIZAÇÃO: Remover validação de URLs (muito lenta)
      // A validação pode ser feita no frontend quando necessário
      const mappingStartTime = Date.now()
      const validatedVoices = (voiceClones || []).map((vc) => {
        // Processar audio_urls (pode ser array ou string única)
        let audioUrls: string[] = []
        if (vc.audio_urls) {
          if (Array.isArray(vc.audio_urls)) {
            audioUrls = vc.audio_urls.filter((url: any) => typeof url === 'string')
          } else if (typeof vc.audio_urls === 'string') {
            audioUrls = [vc.audio_urls]
          }
        }
        
        // Se não tem audio_urls mas tem audio_url, adicionar
        if (vc.audio_url && !audioUrls.includes(vc.audio_url)) {
          audioUrls.unshift(vc.audio_url)
        }

        return {
          id: vc.id,
          name: vc.name,
          voiceId: vc.voice_id,
          audioUrl: vc.audio_url || audioUrls[0] || null,
          audioUrls: audioUrls.length > 0 ? audioUrls : undefined,
          description: vc.description,
          status: vc.status || 'ready',
          createdAt: vc.created_at,
          updatedAt: vc.updated_at,
        }
      })
      
      const mappingTime = Date.now() - mappingStartTime
      const totalTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        voices: validatedVoices,
      })
    } catch (adminError: any) {
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
      
      throw adminError
    }

  } catch (error: any) {
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
    
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

