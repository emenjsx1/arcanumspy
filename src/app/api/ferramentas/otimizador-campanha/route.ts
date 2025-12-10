import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
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
    const { url_campanha } = body

    if (!url_campanha) {
      return NextResponse.json(
        { error: "URL da campanha é obrigatória" },
        { status: 400 }
      )
    }

    // Aqui você implementaria a lógica de otimização
    const otimizacoes = {
      url: url_campanha,
      sugestoes: [
        "Melhorar título da página",
        "Otimizar velocidade de carregamento",
        "Adicionar elementos de urgência",
        "Melhorar CTA (Call to Action)"
      ],
      score_atual: 65,
      score_otimizado: 85
    }

    // Salvar histórico
    const { data, error } = await (supabase
      .from('otimizacoes_campanha') as any)
      .insert({
        user_id: user.id,
        url_campanha,
        sugestoes: otimizacoes.sugestoes,
        score_atual: otimizacoes.score_atual,
        score_otimizado: otimizacoes.score_otimizado
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar otimização:', error)
    }

    return NextResponse.json({
      success: true,
      otimizacao: data || otimizacoes
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

