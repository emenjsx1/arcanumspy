import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Listar comentários de um post
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

    const { data: comments, error } = await supabase
      .from('community_post_comments')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', params.id)
      .is('parent_comment_id', null) // Apenas comentários principais
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar comentários", details: error.message },
        { status: 500 }
      )
    }

    // Buscar respostas (threads) para cada comentário
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('community_post_comments')
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true })

        return {
          ...comment,
          replies: replies || []
        }
      })
    )

    return NextResponse.json({
      success: true,
      comments: commentsWithReplies
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// POST - Criar comentário
export async function POST(
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
    const { content, parent_comment_id } = body

    if (!content) {
      return NextResponse.json(
        { error: "content é obrigatório" },
        { status: 400 }
      )
    }

    const { data: comment, error } = await supabase
      .from('community_post_comments')
      .insert({
        post_id: params.id,
        user_id: user.id,
        content,
        parent_comment_id: parent_comment_id || null
      })
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
        { error: "Erro ao criar comentário", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comment
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}


