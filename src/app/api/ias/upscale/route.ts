import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { upscaleImage } from "@/lib/stability-ai"

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

    const formData = await request.formData()
    const imageFile = formData.get('imagem') as File
    const escala = formData.get('escala') || '2x'
    const modelo = formData.get('modelo') as string || 'esrgan-v1-x2plus'

    if (!imageFile) {
      return NextResponse.json(
        { error: "Arquivo de imagem é obrigatório" },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Arquivo deve ser uma imagem" },
        { status: 400 }
      )
    }

    // Converter arquivo para buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Escolher modelo baseado na escala
    let stabilityModel: 'esrgan-v1-x2plus' | 'stable-diffusion-x4-latent-upscaler' = 'esrgan-v1-x2plus'
    
    if (escala === '4x' || modelo === 'stable-diffusion-x4-latent-upscaler') {
      stabilityModel = 'stable-diffusion-x4-latent-upscaler'
    }

    // Fazer upscale usando Stability AI
    let imageUrl = null
    let errorMessage = null

    try {
      console.log('🔵 Iniciando upscale com Stability AI...', {
        model: stabilityModel,
        imageSize: buffer.length,
        fileName: imageFile.name,
        fileType: imageFile.type
      })
      
      imageUrl = await upscaleImage(buffer, stabilityModel)
      
      console.log('✅ Upscale concluído com sucesso')
    } catch (error: any) {
      console.error('❌ Erro completo ao fazer upscale com Stability AI:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error,
        model: stabilityModel,
        imageSize: buffer.length
      })
      
      errorMessage = error.message || 'Erro desconhecido ao fazer upscale'
      
      // Verificar se é erro de API key
      if (errorMessage.includes('STABILITY_API_KEY')) {
        return NextResponse.json(
          { 
            error: "STABILITY_API_KEY não configurada",
            details: "Configure a variável STABILITY_API_KEY no .env.local"
          },
          { status: 500 }
        )
      }
      
      // Se falhar, retornar erro com mais detalhes
      return NextResponse.json(
        { 
          error: "Erro ao fazer upscale da imagem",
          details: errorMessage,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      )
    }

    // Salvar no banco
    let savedData = null
    try {
      const { data, error } = await (supabase
        .from('upscales') as any)
        .insert({
          user_id: user.id,
          nome_arquivo: imageFile.name,
          escala,
          modelo: stabilityModel,
          url_resultado: imageUrl,
          status: 'concluido'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar upscale:', error)
      } else {
        savedData = data
      }
    } catch (error) {
      console.error('Erro ao salvar no banco:', error)
      // Continuar mesmo se não salvar
    }

    return NextResponse.json({
      success: true,
      resultado: savedData || {
        id: Date.now().toString(),
        arquivo_original: imageFile.name,
        escala,
        modelo: stabilityModel,
        url_resultado: imageUrl,
        status: 'concluido',
        created_at: new Date().toISOString()
      },
      imageUrl,
      message: "Upscale concluído com sucesso"
    })
  } catch (error: any) {
    console.error('Erro ao processar upscale:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}
