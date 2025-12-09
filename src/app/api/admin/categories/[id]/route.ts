import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * PUT /api/admin/categories/[id]
 * Atualizar categoria (admin)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (!profile || profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, description, emoji, is_premium } = body

    const adminClient = createAdminClient()
    const updateData: {
      name?: string
      slug?: string
      description?: string | null
      emoji?: string | null
      is_premium?: boolean
    } = {}
    if (name) updateData.name = name
    if (slug) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (emoji !== undefined) updateData.emoji = emoji
    if (is_premium !== undefined) updateData.is_premium = is_premium
    
    const { data: category, error } = await adminClient
      .from('categories')
      .update(updateData as never)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/categories/[id]:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar categoria" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Deletar categoria (admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (!profile || profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('categories')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/categories/[id]:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao deletar categoria" },
      { status: 500 }
    )
  }
}












