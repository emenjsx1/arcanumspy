import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminGetAllNiches, adminCreateNiche } from "@/lib/db/niches"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const niches = await adminGetAllNiches()

    return NextResponse.json({ niches })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar nichos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, description, category_id, is_active } = body

    if (!name || !slug || !category_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, slug, category_id" },
        { status: 400 }
      )
    }

    const niche = await adminCreateNiche({
      name,
      slug,
      description: description || null,
      category_id,
      is_active: is_active !== undefined ? is_active : true,
    })

    return NextResponse.json({ niche }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar nicho" },
      { status: 500 }
    )
  }
}

