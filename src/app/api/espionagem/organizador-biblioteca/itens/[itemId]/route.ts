import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAuthenticatedServer } from '@/lib/auth/isAuthenticated'

// PATCH - Atualizar item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
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

    const body = await request.json()

    // Verificar se o item pertence ao usuário
    const { data: item, error: itemError } = await supabase
      .from('biblioteca_itens')
      .select('id')
      .eq('id', params.itemId)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar item
    const { data, error } = await (supabase
      .from('biblioteca_itens') as any)
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.itemId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar item", details: error.message },
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

// DELETE - Deletar item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
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

    // Verificar se o item pertence ao usuário
    const { data: item, error: itemError } = await supabase
      .from('biblioteca_itens')
      .select('id')
      .eq('id', params.itemId)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      )
    }

    // Deletar item
    const { error } = await supabase
      .from('biblioteca_itens')
      .delete()
      .eq('id', params.itemId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar item", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}




