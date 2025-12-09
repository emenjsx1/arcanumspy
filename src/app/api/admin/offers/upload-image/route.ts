import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  console.log('📤 [Upload Image] Iniciando processamento...')
  
  try {
    console.log('🔐 [Upload Image] Verificando autenticação...')
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // Se não encontrou usuário via cookies, tentar via Authorization header
    if (authError || !user) {
      console.log('🔄 [Upload Image] Tentando autenticação via header...')
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
          console.log('✅ [Upload Image] Usuário autenticado via header')
        }
      }
    }

    if (!user) {
      console.error('❌ [Upload Image] Usuário não autenticado')
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    console.log('👤 [Upload Image] Usuário:', user.id)

    // Verificar se é admin
    console.log('🔧 [Upload Image] Criando admin client...')
    let adminClient
    try {
      adminClient = createAdminClient()
      console.log('✅ [Upload Image] Admin client criado')
    } catch (adminError: any) {
      console.error('❌ [Upload Image] Erro ao criar admin client:', adminError)
      return NextResponse.json(
        { error: adminError.message || "Erro de configuração do servidor" },
        { status: 500 }
      )
    }

    console.log('🔍 [Upload Image] Verificando perfil do usuário...')
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ [Upload Image] Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        { error: "Erro ao verificar permissões" },
        { status: 500 }
      )
    }

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    console.log('👮 [Upload Image] Role do usuário:', profileRole)
    
    if (profileRole !== 'admin') {
      console.error('❌ [Upload Image] Usuário não é admin')
      return NextResponse.json(
        { error: "Não autorizado. Apenas administradores podem fazer upload de imagens." },
        { status: 403 }
      )
    }

    console.log('📦 [Upload Image] Processando FormData...')
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      console.error('❌ [Upload Image] Arquivo não encontrado no FormData')
      return NextResponse.json(
        { error: "Arquivo de imagem é obrigatório" },
        { status: 400 }
      )
    }

    console.log('📄 [Upload Image] Arquivo recebido:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    })

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      console.error('❌ [Upload Image] Tipo de arquivo não permitido:', imageFile.type)
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use JPG, PNG ou WEBP." },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (imageFile.size > maxSize) {
      console.error('❌ [Upload Image] Arquivo muito grande:', imageFile.size)
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 5MB" },
        { status: 400 }
      )
    }

    console.log('🔄 [Upload Image] Convertendo para Buffer...')
    // Converter para Buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('✅ [Upload Image] Buffer criado, tamanho:', buffer.length)

    // Gerar nome único para o arquivo
    const fileExtension = imageFile.name.split('.').pop() || 'jpg'
    const fileName = `offers/${user.id}/${randomUUID()}.${fileExtension}`
    console.log('📝 [Upload Image] Nome do arquivo:', fileName)

    // Fazer upload para Supabase Storage
    const bucket = 'voice-clones'
    console.log('☁️ [Upload Image] Fazendo upload para bucket:', bucket)
    
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ [Upload Image] Erro ao fazer upload:', uploadError)
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ [Upload Image] Upload concluído:', uploadData.path)

    // Obter URL pública
    const { data: { publicUrl } } = adminClient.storage
      .from(bucket)
      .getPublicUrl(uploadData.path)

    console.log('🔗 [Upload Image] URL pública gerada:', publicUrl)

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      path: uploadData.path,
    })
  } catch (error: any) {
    console.error('❌ [Upload Image] Erro geral:', error)
    console.error('❌ [Upload Image] Stack:', error.stack)
    return NextResponse.json(
      { error: error.message || "Erro ao processar upload" },
      { status: 500 }
    )
  }
}

