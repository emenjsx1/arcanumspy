import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateImage } from "@/lib/stability-ai"

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
    const { descricao, estilo, dimensoes, prompt_extra } = body

    if (!descricao) {
      return NextResponse.json(
        { error: "Descrição é obrigatória" },
        { status: 400 }
      )
    }

    // Extrair dimensões
    const [width, height] = dimensoes ? dimensoes.split('x').map(Number) : [1024, 1024]
    
    // Validar dimensões (mínimo 64, máximo 2048 - será ajustado automaticamente para 1024 se necessário)
    if (isNaN(width) || isNaN(height) || width < 64 || height < 64 || width > 2048 || height > 2048) {
      return NextResponse.json(
        { error: "Dimensões inválidas. Use formato 'WIDTHxHEIGHT' (mínimo: 64x64, máximo: 2048x2048). Dimensões maiores que 1024x1024 serão ajustadas automaticamente." },
        { status: 400 }
      )
    }
    
    // Mapear estilos do front-end para style_presets válidos da Stability AI
    const stylePresetMap: Record<string, string | undefined> = {
      'profissional': 'photographic',
      'criativo': 'digital-art',
      'minimalista': 'line-art',
      'colorido': 'enhance',
      'cinematic': 'cinematic',
      'anime': 'anime',
      'fantasy': 'fantasy-art',
      '3d': '3d-model',
      'pixel': 'pixel-art',
      'comic': 'comic-book',
      'analog': 'analog-film',
      'isometric': 'isometric',
      'neon': 'neon-punk',
      'origami': 'origami',
      'low-poly': 'low-poly',
      'tile': 'tile-texture',
      'modeling': 'modeling-compound'
    }

    // Preparar prompt melhorado com estilo
    let prompt = descricao
    if (estilo) {
      prompt = `${descricao}, estilo ${estilo}, alta qualidade, profissional`
    }
    if (prompt_extra) {
      prompt = `${prompt}, ${prompt_extra}`
    }
    
    // Obter style_preset válido ou undefined
    const stylePreset = estilo ? stylePresetMap[estilo.toLowerCase()] : undefined
    
    // Gerar imagem usando Stability AI
    let imageUrl = null
    let errorMessage = null

    try {
      console.log('🔵 Iniciando geração de imagem com Stability AI...')
      console.log('Prompt:', prompt)
      console.log('Dimensões:', width, 'x', height)
      console.log('Style Preset:', stylePreset || 'nenhum')
      
      imageUrl = await generateImage({
        prompt,
        width,
        height,
        steps: 30,
        cfg_scale: 7,
        samples: 1,
        style_preset: stylePreset
      })
      
      console.log('✅ Imagem gerada com sucesso')
    } catch (error: any) {
      console.error('❌ Erro ao gerar imagem com Stability AI:', error)
      console.error('Stack:', error.stack)
      errorMessage = error.message || 'Erro desconhecido ao gerar imagem'
      
      // Retornar erro mais detalhado para debug
      return NextResponse.json(
        { 
          success: false,
          error: "Erro ao gerar imagem",
          details: errorMessage,
          hint: "Verifique se a API key da Stability AI está configurada corretamente"
        },
        { status: 500 }
      )
    }

    // Salvar no banco
    let savedData = null
    try {
      const { data, error } = await (supabase
        .from('criativos_gerados') as any)
        .insert({
          user_id: user.id,
          descricao,
          estilo: estilo || 'profissional',
          dimensoes: dimensoes || '1024x1024',
          url: imageUrl,
          status: 'concluido'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar criativo:', error)
      } else {
        savedData = data
      }
    } catch (error) {
      console.error('Erro ao salvar no banco:', error)
      // Continuar mesmo se não salvar
    }

    return NextResponse.json({
      success: true,
      criativo: savedData || {
        id: Date.now().toString(),
        descricao,
        estilo: estilo || 'profissional',
        dimensoes: dimensoes || '1024x1024',
        url: imageUrl,
        status: 'concluido',
        created_at: new Date().toISOString()
      },
      imageUrl,
      message: "Criativo gerado com sucesso"
    })
  } catch (error: any) {
    console.error('Erro ao processar geração de criativo:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

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

    const { data, error } = await (supabase
      .from('criativos_gerados') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar criativos", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      criativos: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}
