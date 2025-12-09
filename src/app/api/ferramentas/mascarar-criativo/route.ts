import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se não encontrou usuário via cookies, tentar via Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
        user = userFromToken
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const criativoFile = formData.get('criativo') as File
    const elementos = formData.get('elementos') as string

    if (!criativoFile) {
      return NextResponse.json(
        { error: "Arquivo de criativo é obrigatório" },
        { status: 400 }
      )
    }

    // Aqui você implementaria a lógica de mascaramento
    const resultado = {
      id: Date.now().toString(),
      arquivo_original: criativoFile.name,
      elementos_mascarados: elementos ? JSON.parse(elementos) : [],
      url_resultado: null,
      status: 'processando',
      created_at: new Date().toISOString()
    }

    // Salvar histórico
    const { data, error } = await supabase
      .from('mascaramentos_criativo')
      .insert({
        user_id: user.id,
        nome_arquivo: criativoFile.name,
        elementos_mascarados: resultado.elementos_mascarados,
        status: 'processando'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar mascaramento:', error)
    }

    return NextResponse.json({
      success: true,
      resultado: data || resultado,
      message: "Mascaramento em processamento"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

