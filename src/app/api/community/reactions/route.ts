import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Criar ou remover reação
export async function POST(request: NextRequest) {
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
    const { post_id, comment_id, reaction_type } = body

    if (!reaction_type) {
      return NextResponse.json(
        { error: "reaction_type é obrigatório" },
        { status: 400 }
      )
    }

    if (!post_id && !comment_id) {
      return NextResponse.json(
        { error: "post_id ou comment_id é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se já existe reação
    let query = supabase
      .from('community_post_reactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)

    if (post_id) {
      query = query.eq('post_id', post_id).is('comment_id', null)
    } else {
      query = query.eq('comment_id', comment_id).is('post_id', null)
    }

    const { data: existingReaction } = await query.single()

    if (existingReaction) {
      // Remover reação existente (toggle)
      const { error: deleteError } = await supabase
        .from('community_post_reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        return NextResponse.json(
          { error: "Erro ao remover reação", details: deleteError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: "Reação removida"
      })
    } else {
      // Criar nova reação
      const { data: reaction, error: insertError } = await supabase
        .from('community_post_reactions')
        .insert({
          post_id: post_id || null,
          comment_id: comment_id || null,
          user_id: user.id,
          reaction_type
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: "Erro ao criar reação", details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'added',
        reaction
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// GET - Buscar reações de um post ou comentário
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('post_id')
    const commentId = searchParams.get('comment_id')

    if (!postId && !commentId) {
      return NextResponse.json(
        { error: "post_id ou comment_id é obrigatório" },
        { status: 400 }
      )
    }

    let query = supabase
      .from('community_post_reactions')
      .select('*')

    if (postId) {
      query = query.eq('post_id', postId).is('comment_id', null)
    } else {
      query = query.eq('comment_id', commentId).is('post_id', null)
    }

    const { data: reactions, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar reações", details: error.message },
        { status: 500 }
      )
    }

    // Agrupar por tipo de reação
    const grouped = (reactions || []).reduce((acc: any, reaction) => {
      if (!acc[reaction.reaction_type]) {
        acc[reaction.reaction_type] = []
      }
      acc[reaction.reaction_type].push(reaction)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      reactions: grouped,
      total: reactions?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}


