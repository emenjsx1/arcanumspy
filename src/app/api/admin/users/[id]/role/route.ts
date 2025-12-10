import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Database } from "@/types/database"

type Profile = Database['public']['Tables']['profiles']['Row']

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se o usuário é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileData = profile as Pick<Profile, 'role'> | null
    if (profileError || profileData?.role !== 'admin') {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    if (!role || (role !== 'admin' && role !== 'user')) {
      return NextResponse.json(
        { error: "Role inválido. Deve ser 'admin' ou 'user'" },
        { status: 400 }
      )
    }

    const userId = params.id

    // Verificar se o usuário alvo existe
    const adminClient = createAdminClient()
    const { data: targetUser, error: targetError } = await adminClient
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Não permitir que um admin remova seu próprio role de admin
    if (userId === user.id && role === 'user') {
      return NextResponse.json(
        { error: "Você não pode remover seu próprio acesso de admin" },
        { status: 400 }
      )
    }

    // Atualizar o role usando admin client (bypass RLS)
    const { data: updatedProfile, error: updateError } = await (adminClient
      .from('profiles') as any)
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar role do usuário:', updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar role do usuário", details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Role do usuário atualizado para ${role}`,
      profile: updatedProfile
    })

  } catch (error: any) {
    console.error('Erro ao atualizar role do usuário:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar role do usuário" },
      { status: 500 }
    )
  }
}

