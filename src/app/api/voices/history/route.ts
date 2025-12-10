import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Tentar obter usuário
    let user = null
    let authError = null
    
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
        },
        { status: 401 }
      )
    }

    // Buscar histórico de narrações do usuário
    try {
      const adminClient = createAdminClient()
      
      // Buscar narrações com informações da voz
      const { data: narrations, error: dbError } = await adminClient
        .from('voice_audio_generations')
        .select(`
          *,
          voice_clones (
            id,
            name,
            description,
            voice_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (dbError) {
        console.error('Erro ao buscar histórico:', dbError)
        return NextResponse.json(
          { error: "Erro ao buscar histórico", details: dbError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        narrations: (narrations as any[])?.map((n: any) => ({
          id: n.id,
          text: n.text,
          audioUrl: n.audio_url,
          voiceCloneId: n.voice_clone_id,
          voiceName: (n.voice_clones as any)?.name || 'Voz desconhecida',
          createdAt: n.created_at,
        })) || [],
      })
    } catch (adminError: any) {
      console.error('❌ Erro ao criar admin client:', adminError.message)
      
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
    console.error('❌ Erro ao buscar histórico:', error)
    
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

