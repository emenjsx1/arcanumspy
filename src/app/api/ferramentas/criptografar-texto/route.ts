import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptText, decryptText, encryptIfEnabled, decryptIfNeeded } from "@/lib/unicode-crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // Se não conseguir via cookies, tentar via header
    if (!user && authError) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
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
    const { texto, acao, usar_criptografia } = body

    if (!texto) {
      return NextResponse.json(
        { error: "Texto é obrigatório" },
        { status: 400 }
      )
    }

    let resultado = texto
    let textoParaSalvar = texto
    let textoOriginal = texto

    if (acao === 'criptografar') {
      // Criptografar usando Unicode se a opção estiver ativada
      if (usar_criptografia) {
        resultado = encryptText(texto)
        textoParaSalvar = resultado
      } else {
        // Se não usar criptografia, apenas retornar o texto original
        resultado = texto
        textoParaSalvar = texto
      }
      textoOriginal = texto
    } else if (acao === 'descriptografar') {
      try {
        // Tentar descriptografar (funciona mesmo se não estiver criptografado)
        resultado = decryptIfNeeded(texto)
        textoParaSalvar = texto // Manter o texto criptografado no banco
        textoOriginal = resultado
      } catch (error) {
        return NextResponse.json(
          { error: "Erro ao descriptografar texto" },
          { status: 400 }
        )
      }
    }

    // Salvar histórico no banco
    try {
      const { data, error } = await (supabase
        .from('criptografias_texto') as any)
        .insert({
          user_id: user.id,
          texto_original: acao === 'criptografar' ? textoOriginal : null,
          texto_criptografado: acao === 'criptografar' ? textoParaSalvar : texto,
          acao,
          usar_criptografia: usar_criptografia || false
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar criptografia:', error)
        // Continuar mesmo se não salvar no banco
      }
    } catch (error) {
      console.error('Erro ao salvar no banco:', error)
      // Continuar mesmo se não salvar no banco
    }

    return NextResponse.json({
      success: true,
      resultado,
      acao,
      usar_criptografia: usar_criptografia || false
    })
  } catch (error: any) {
    console.error('Erro ao processar criptografia:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

/**
 * GET - Buscar histórico de criptografias do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // Se não conseguir via cookies, tentar via header
    if (!user && authError) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
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

    const { data, error } = await supabase
      .from('criptografias_texto')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      return NextResponse.json(
        { error: "Erro ao buscar histórico" },
        { status: 500 }
      )
    }

    // Descriptografar textos se necessário
    const historico = (data || []).map((item: Record<string, any>) => ({
      ...item,
      texto_original: item.texto_original ? decryptIfNeeded(item.texto_original) : null,
      texto_criptografado: item.texto_criptografado ? decryptIfNeeded(item.texto_criptografado) : null
    }))

    return NextResponse.json({
      success: true,
      historico
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}
