import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      console.error('❌ Erro de autenticação DELETE:', authError?.message || 'Usuário não encontrado')
      return NextResponse.json(
        { 
          error: "Não autenticado", 
          details: authError?.message || "Sessão não encontrada",
          hint: "Faça login novamente"
        },
        { status: 401 }
      )
    }
    

    const voiceId = params.id

    // Verificar se a voz pertence ao usuário
    const adminClient = createAdminClient()
    const { data: voiceClone, error: voiceError } = await adminClient
      .from('voice_clones')
      .select('*')
      .eq('id', voiceId)
      .eq('user_id', user.id)
      .single()

    if (voiceError || !voiceClone) {
      return NextResponse.json(
        { error: "Voz não encontrada ou não pertence ao usuário" },
        { status: 404 }
      )
    }

    // Deletar voz (CASCADE deletará as gerações também)
    const { error: deleteError } = await adminClient
      .from('voice_clones')
      .delete()
      .eq('id', voiceId)

    if (deleteError) {
      console.error('Erro ao deletar voz:', deleteError)
      return NextResponse.json(
        { error: "Erro ao deletar voz" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Voz deletada com sucesso",
    })

  } catch (error: any) {
    console.error('Erro ao deletar voz:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

