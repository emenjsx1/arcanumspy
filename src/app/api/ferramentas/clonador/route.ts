/**
 * API Route: Clonador de Sites
 * Faz download de todos os assets de um site e retorna em formato ZIP
 */

import { NextRequest, NextResponse } from 'next/server'
import { crawlSite } from '@/lib/site-cloner/crawler'
import { createZip } from '@/lib/site-cloner/zipper'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (tentar cookies primeiro, depois header)
    let user = null
    let authError = null
    
    const supabase = await createClient()
    const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()

    if (!cookieError && cookieUser) {
      user = cookieUser
    } else {
      // Tentar autenticação via header Authorization
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        const { data: { user: tokenUser } } = await tempClient.auth.getUser(token)
        if (tokenUser) {
          user = tokenUser
        } else {
          authError = new Error('Token inválido')
        }
      } else {
        authError = cookieError || new Error('Não autenticado')
      }
    }

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter URL do body
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      )
    }

    // Validar formato de URL básico
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      )
    }

    // Fazer crawling do site
    console.log(`🔍 Iniciando clonagem de: ${url}`)
    const crawlResult = await crawlSite(url)

    // Verificar se temos assets
    if (!crawlResult.assets || crawlResult.assets.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi baixado. Verifique se a URL está acessível e tente novamente.' },
        { status: 400 }
      )
    }

    // Criar arquivo ZIP
    console.log(`📦 Criando ZIP com ${crawlResult.assets.length} arquivos (${(crawlResult.totalSize / 1024 / 1024).toFixed(2)} MB)`)
    
    let zipBuffer: Buffer
    try {
      zipBuffer = await createZip(crawlResult.assets)
    } catch (error: any) {
      console.error('❌ Erro ao criar ZIP:', error)
      return NextResponse.json(
        { error: `Erro ao criar arquivo ZIP: ${error.message}` },
        { status: 500 }
      )
    }
    
    if (!zipBuffer || zipBuffer.length === 0) {
      console.error('❌ ZIP criado está vazio!')
      return NextResponse.json(
        { error: 'Erro ao criar arquivo ZIP. O arquivo está vazio. Verifique os logs do servidor.' },
        { status: 500 }
      )
    }
    
    console.log(`✅ ZIP criado com sucesso: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB (${zipBuffer.length} bytes)`)

    // Gerar nome do arquivo baseado no domínio
    const domain = crawlResult.domain.replace(/[^a-z0-9]/gi, '-')
    const fileName = `site-${domain}-${Date.now()}.zip`

    // Verificar se o buffer é válido
    if (!Buffer.isBuffer(zipBuffer) || zipBuffer.length === 0) {
      console.error('❌ zipBuffer inválido ou vazio!', {
        isBuffer: Buffer.isBuffer(zipBuffer),
        length: zipBuffer.length
      })
      return NextResponse.json(
        { error: 'Erro interno: Buffer inválido ou vazio' },
        { status: 500 }
      )
    }
    
    console.log(`📤 Enviando ZIP: ${zipBuffer.length} bytes`)

    // Retornar ZIP como resposta - converter Buffer para Uint8Array
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao clonar site:', error)
    
    // Retornar erro específico se disponível
    const errorMessage = error.message || 'Erro ao clonar site'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

