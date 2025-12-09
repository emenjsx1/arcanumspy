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

    const body = await request.json()
    const { url_criativo, senha } = body

    if (!url_criativo) {
      return NextResponse.json(
        { error: "URL do criativo é obrigatória" },
        { status: 400 }
      )
    }

    // Aqui você implementaria a lógica de esconder criativo
    const resultado = {
      id: Date.now().toString(),
      url_original: url_criativo,
      url_escondida: null,
      senha_protegida: senha ? true : false,
      status: 'processando',
      created_at: new Date().toISOString()
    }

    // Salvar histórico
    const { data, error } = await supabase
      .from('criativos_escondidos')
      .insert({
        user_id: user.id,
        url_original: url_criativo,
        senha_protegida: resultado.senha_protegida,
        status: 'processando'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar criativo escondido:', error)
    }

    return NextResponse.json({
      success: true,
      resultado: data || resultado,
      message: "Criativo sendo escondido"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

