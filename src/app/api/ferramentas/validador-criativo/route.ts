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

    if (!criativoFile) {
      return NextResponse.json(
        { error: "Arquivo de criativo é obrigatório" },
        { status: 400 }
      )
    }

    // Validações básicas
    const validacao = {
      arquivo: criativoFile.name,
      tamanho: criativoFile.size,
      tipo: criativoFile.type,
      valido: true,
      problemas: [] as string[],
      sugestoes: [] as string[]
    }

    // Verificar tamanho (máx 10MB)
    if (criativoFile.size > 10 * 1024 * 1024) {
      validacao.valido = false
      validacao.problemas.push("Arquivo muito grande (máximo 10MB)")
    }

    // Verificar tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
    if (!tiposPermitidos.includes(criativoFile.type)) {
      validacao.valido = false
      validacao.problemas.push("Tipo de arquivo não permitido")
    }

    if (validacao.valido) {
      validacao.sugestoes.push("Criativo válido e pronto para uso")
    }

    // Salvar histórico
    const { data, error } = await supabase
      .from('validacoes_criativo')
      .insert({
        user_id: user.id,
        nome_arquivo: criativoFile.name,
        valido: validacao.valido,
        problemas: validacao.problemas,
        sugestoes: validacao.sugestoes
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar validação:', error)
    }

    return NextResponse.json({
      success: true,
      validacao: data || validacao
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

