import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAuthenticatedServer } from '@/lib/auth/isAuthenticated'

// GET - Buscar itens de uma pasta
export async function GET(
  request: NextRequest,
  { params }: { params: { pastaId: string } }
) {
  try {
    const authenticated = await isAuthenticatedServer(request)
    
    if (!authenticated) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login para continuar." },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
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

    // Verificar se a pasta pertence ao usuário
    const { data: pasta, error: pastaError } = await supabase
      .from('biblioteca_pastas')
      .select('id')
      .eq('id', params.pastaId)
      .eq('user_id', user.id)
      .single()

    if (pastaError || !pasta) {
      return NextResponse.json(
        { error: "Pasta não encontrada" },
        { status: 404 }
      )
    }

    // Buscar itens da pasta
    const { data: itens, error } = await supabase
      .from('biblioteca_itens')
      .select('*')
      .eq('pasta_id', params.pastaId)
      .eq('user_id', user.id)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar itens", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      itens: itens || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// POST - Adicionar item à pasta
export async function POST(
  request: NextRequest,
  { params }: { params: { pastaId: string } }
) {
  try {
    const authenticated = await isAuthenticatedServer(request)
    
    if (!authenticated) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login para continuar." },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
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

    // Verificar se a pasta pertence ao usuário
    const { data: pasta, error: pastaError } = await supabase
      .from('biblioteca_pastas')
      .select('id')
      .eq('id', params.pastaId)
      .eq('user_id', user.id)
      .single()

    if (pastaError || !pasta) {
      return NextResponse.json(
        { error: "Pasta não encontrada" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { tipo, item_id, titulo, url, descricao, notas, imagem_url } = body

    if (!titulo || !tipo) {
      return NextResponse.json(
        { error: "Título e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar maior ordem atual para adicionar no final
    const { data: lastItem } = await supabase
      .from('biblioteca_itens')
      .select('ordem')
      .eq('pasta_id', params.pastaId)
      .order('ordem', { ascending: false })
      .limit(1)
      .single()

    const lastItemData = lastItem as { ordem?: number } | null
    const novaOrdem = lastItemData?.ordem ? lastItemData.ordem + 1 : 0

    const { data, error } = await (supabase
      .from('biblioteca_itens') as any)
      .insert({
        pasta_id: params.pastaId,
        user_id: user.id,
        tipo: tipo || 'manual',
        item_id: item_id || null,
        titulo,
        url: url || null,
        descricao: descricao || null,
        notas: notas || null,
        imagem_url: imagem_url || null,
        ordem: novaOrdem
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao adicionar item", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      item: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}




