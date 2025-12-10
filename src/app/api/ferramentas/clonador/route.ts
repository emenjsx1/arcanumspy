import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { crawlSite } from "@/lib/site-cloner/crawler"
import { createZip } from "@/lib/site-cloner/zipper"
import { saveToStorage } from "@/lib/storage"
import { randomUUID } from "crypto"

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
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: "URL é obrigatória" },
        { status: 400 }
      )
    }

    // Validar formato de URL básico
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        { error: "URL deve começar com http:// ou https://" },
        { status: 400 }
      )
    }

    console.log(`🚀 Iniciando clonagem de: ${url}`)

    // 1. Fazer crawling do site
    const crawlResult = await crawlSite(url)
    console.log(`✅ Crawling completo: ${crawlResult.assets.length} assets`)

    // 2. Criar arquivo ZIP
    console.log(`📦 Criando arquivo ZIP...`)
    const zipBuffer = await createZip(crawlResult.assets)
    console.log(`✅ ZIP criado: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`)

    // 3. Salvar ZIP no storage
    const zipId = randomUUID()
    const zipFileName = `site-clones/${user.id}/${zipId}.zip`
    
    console.log(`💾 Salvando ZIP no storage...`)
    const downloadUrl = await saveToStorage(zipBuffer, zipFileName, 'voice-clones')
    console.log(`✅ ZIP salvo: ${downloadUrl}`)

    // 4. Salvar histórico no banco (se a tabela existir)
    try {
      const { error: dbError } = await (supabase
        .from('clones') as any)
        .insert({
          user_id: user.id,
          url_original: url,
          download_url: downloadUrl,
          file_size: zipBuffer.length,
          assets_count: crawlResult.assets.length,
          status: 'concluido'
        })

      if (dbError) {
        console.warn('⚠️ Erro ao salvar histórico (não crítico):', dbError.message)
      }
    } catch (dbError) {
      console.warn('⚠️ Tabela clones não existe ou erro ao salvar (não crítico)')
    }

    return NextResponse.json({
      status: "ok",
      download_url: downloadUrl,
      stats: {
        assets_count: crawlResult.assets.length,
        total_size: crawlResult.totalSize,
        zip_size: zipBuffer.length
      }
    })
  } catch (error: any) {
    console.error('❌ Erro na clonagem:', error)
    
    // Retornar erro específico
    const errorMessage = error.message || "Erro ao processar clonagem"
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.stack
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase
      .from('clones')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar clones", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clones: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

