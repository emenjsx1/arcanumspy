/**
 * API Route: POST /api/mascarar/imagem
 * 
 * Remove todos os metadados de imagens (PNG, JPG, JPEG, WEBP)
 * 
 * Recebe: FormData com arquivo 'file'
 * Retorna: Arquivo processado sem metadados
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthenticatedServer } from '@/lib/auth/isAuthenticated'
import { mascararImagem, generateTempPath } from '@/lib/mascarar-criativo'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'

// Tamanho máximo: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

// Extensões permitidas
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const authenticated = await isAuthenticatedServer(request)
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Não autenticado. Faça login para continuar.' },
        { status: 401 }
      )
    }

    // Verificar usuário
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
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
        const { data: { user: userFromToken } } = await tempClient.auth.getUser(token)
        if (userFromToken) {
          user = userFromToken
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Obter arquivo do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Verificar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Verificar extensão
    const fileName = file.name.toLowerCase()
    const extension = fileName.split('.').pop()
    
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `Formato não suportado. Use: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}` },
        { status: 400 }
      )
    }

    // Criar arquivos temporários
    const inputPath = generateTempPath(extension)
    const outputPath = generateTempPath(extension)

    try {
      // Salvar arquivo temporário
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await writeFile(inputPath, buffer)

      // Processar imagem (remover metadados)
      const result = await mascararImagem(inputPath, outputPath)

      if (!result.success) {
        // Limpar arquivos temporários
        try {
          await unlink(inputPath)
          await unlink(outputPath)
        } catch {}

        return NextResponse.json(
          { error: result.error || 'Erro ao processar imagem' },
          { status: 500 }
        )
      }

      // Ler arquivo processado
      const outputBuffer = await readFile(outputPath)

      // Limpar arquivos temporários
      try {
        await unlink(inputPath)
        await unlink(outputPath)
      } catch {}

      // Retornar arquivo limpo
      const outputFileName = `mascarado-${Date.now()}.${extension}`
      
      return new NextResponse(outputBuffer, {
        status: 200,
        headers: {
          'Content-Type': `image/${extension === 'jpg' ? 'jpeg' : extension}`,
          'Content-Disposition': `attachment; filename="${outputFileName}"`,
          'Content-Length': outputBuffer.length.toString(),
        },
      })
    } catch (error: any) {
      // Limpar arquivos temporários em caso de erro
      try {
        await unlink(inputPath).catch(() => {})
        await unlink(outputPath).catch(() => {})
      } catch {}

      return NextResponse.json(
        { error: `Erro ao processar arquivo: ${error.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}
