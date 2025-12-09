import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { removeBackground } from "@/lib/remove-bg"

export async function POST(request: NextRequest) {
  try {
    // CORREÇÃO: Validar REMOVE_BG_API_KEY antes de processar
    if (!process.env.REMOVE_BG_API_KEY) {
      console.error('❌ REMOVE_BG_API_KEY não configurada')
      return NextResponse.json(
        { error: "Serviço de remoção de background não configurado" },
        { status: 503 }
      )
    }

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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo de imagem é obrigatório" },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Arquivo deve ser uma imagem" },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 10MB" },
        { status: 400 }
      )
    }

    // Converter arquivo para buffer
    let buffer: Buffer
    try {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      
      // Validar que o buffer não está vazio
      if (buffer.length === 0) {
        return NextResponse.json(
          { error: "Arquivo de imagem está vazio" },
          { status: 400 }
        )
      }
    } catch (error: any) {
      console.error('❌ Erro ao converter arquivo para buffer:', error)
      return NextResponse.json(
        { error: "Erro ao processar arquivo" },
        { status: 400 }
      )
    }

    // Remover background usando remove.bg API
    let imageUrl = null
    let errorMessage = null

    try {
      // Usar remove.bg com opções padrão
      imageUrl = await removeBackground(buffer, {
        size: 'auto', // Tamanho automático
        format: 'png', // PNG com transparência
      })
      
      // Validar que a resposta não está vazia
      if (!imageUrl || imageUrl.length === 0) {
        throw new Error('Resposta vazia da API remove.bg')
      }
    } catch (error: any) {
      console.error('❌ Erro completo ao remover background com remove.bg:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error
      })
      errorMessage = error.message || 'Erro desconhecido ao remover background'
      
      return NextResponse.json(
        { 
          error: "Erro ao remover background",
          details: errorMessage,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      )
    }

    // CORREÇÃO: Salvar no banco apenas se a tabela existir (opcional, não quebra se falhar)
    try {
      const base64Image = buffer.toString('base64')
      const { data, error } = await supabase
        .from('imagens_processadas')
        .insert({
          user_id: user.id,
          tipo: 'remover_background',
          url_original: `data:${file.type};base64,${base64Image}`,
          url_processada: imageUrl,
        })
        .select()
        .single()

      if (error) {
        // Se a tabela não existir (código 42P01) ou qualquer outro erro, apenas logar
        // Não quebrar a resposta se o salvamento falhar
        if (error.code === '42P01' || error.code === 'PGRST202') {
          console.warn('⚠️ Tabela imagens_processadas não existe, pulando salvamento')
        } else {
          console.error('⚠️ Erro ao salvar imagem processada (não crítico):', error.message)
        }
      }
    } catch (error: any) {
      // Tabela pode não existir ou qualquer outro erro - apenas logar, não quebrar
      if (error.code === '42P01' || error.code === 'PGRST202') {
        console.warn('⚠️ Tabela imagens_processadas não existe, pulando salvamento')
      } else {
        console.error('⚠️ Erro ao salvar no banco (não crítico):', error.message)
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Background removido com sucesso"
    })
  } catch (error: any) {
    console.error('❌ Error in background removal:', error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar imagem",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
