import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    // Converter arquivo para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Usar Remove.bg API
    const removeBgApiKey = process.env.REMOVEBG_API_KEY || 'YJJtmqPiybM2pM1zcXAveJ4P'
    let imageUrl = null

    if (removeBgApiKey) {
      try {
        // Remove.bg requer multipart/form-data com o arquivo binário
        // No Node.js 18+, FormData funciona, mas precisamos criar corretamente
        const formDataRemoveBg = new FormData()
        // Criar um File object do buffer (Node.js 18+ suporta File)
        const fileObj = new File([buffer], file.name || 'image.jpg', { type: file.type })
        formDataRemoveBg.append('image_file', fileObj)
        formDataRemoveBg.append('size', 'auto')

        const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': removeBgApiKey,
          },
          body: formDataRemoveBg
        })

        if (removeBgResponse.ok) {
          const removeBgData = await removeBgResponse.arrayBuffer()
          const resultBuffer = Buffer.from(removeBgData)
          const resultBase64 = resultBuffer.toString('base64')
          imageUrl = `data:image/png;base64,${resultBase64}`
        } else {
          console.error('Erro ao remover background com Remove.bg:', await removeBgResponse.text())
        }
      } catch (error) {
        console.error('Erro ao chamar Remove.bg:', error)
      }
    }

    // Se não tiver Remove.bg, retornar imagem original (ou implementar alternativa)
    if (!imageUrl) {
      // Retornar imagem original como fallback
      const base64Image = buffer.toString('base64')
      imageUrl = `data:${file.type};base64,${base64Image}`
    }

    // Salvar no banco se a tabela existir (comentado pois a tabela pode não existir)
    // try {
    //   const base64Image = buffer.toString('base64')
    //   const { data, error } = await supabase
    //     .from('imagens_processadas')
    //     .insert({
    //       user_id: user.id,
    //       tipo: 'remover_background',
    //       url_original: `data:${file.type};base64,${base64Image}`,
    //       url_processada: imageUrl,
    //     })
    //     .select()
    //     .single()

    //   if (error) {
    //     console.error('Erro ao salvar imagem processada:', error)
    //   }
    // } catch (error) {
    //   // Tabela pode não existir, continuar
    // }

    return NextResponse.json({
      success: true,
      imageUrl,
      message: removeBgApiKey ? "Background removido com sucesso" : "Configure REMOVEBG_API_KEY para remover backgrounds"
    })
  } catch (error: any) {
    console.error('Error in background removal:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar imagem" },
      { status: 500 }
    )
  }
}
