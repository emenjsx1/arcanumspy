import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar post específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { data: post, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Post não encontrado", details: error.message },
        { status: 404 }
      )
    }

    const postData = post as { views_count?: number; [key: string]: any }

    // Incrementar contador de visualizações
    await (supabase
      .from('community_posts') as any)
      .update({ views_count: (postData.views_count || 0) + 1 })
      .eq('id', params.id)

    return NextResponse.json({
      success: true,
      post: { ...postData, views_count: (postData.views_count || 0) + 1 }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, category } = body

    // Verificar se o post pertence ao usuário
    const { data: existingPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      )
    }

    const existingPostData = existingPost as { user_id: string }
    if (existingPostData.user_id !== user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este post" },
        { status: 403 }
      )
    }

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (category !== undefined) updates.category = category

    const { data: post, error } = await (supabase
      .from('community_posts') as any)
      .update(updates)
      .eq('id', params.id)
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar post", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Verificar se o post pertence ao usuário
    const { data: existingPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      )
    }

    const existingPostDataDelete = existingPost as { user_id: string }
    if (existingPostDataDelete.user_id !== user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar este post" },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar post", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Post deletado com sucesso"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}


