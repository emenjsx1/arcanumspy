import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // Se não conseguir via cookies, tentar via header
    if (!user && authError) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
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
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se o usuário é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: "Não autorizado. Apenas admins podem bloquear usuários." }, { status: 403 })
    }

    const body = await request.json()
    const { blocked } = body

    if (typeof blocked !== 'boolean') {
      return NextResponse.json(
        { error: "Parâmetro 'blocked' deve ser true ou false" },
        { status: 400 }
      )
    }

    const userId = params.id

    // Verificar se o usuário alvo existe
    const adminClient = createAdminClient()
    const { data: targetUser, error: targetError } = await adminClient
      .from('profiles')
      .select('id, email, name, role, has_active_subscription')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Não permitir bloquear outros admins
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: "Não é possível bloquear usuários com role de admin" },
        { status: 400 }
      )
    }

    // Não permitir que um admin se bloqueie
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Você não pode bloquear sua própria conta" },
        { status: 400 }
      )
    }

    // IMPORTANTE: Só permitir BLOQUEAR, não desbloquear manualmente
    // Usuários bloqueados só podem ser desbloqueados através de um novo pagamento
    if (!blocked) {
      return NextResponse.json(
        { 
          error: "Não é possível desbloquear manualmente. O usuário precisa fazer um novo pagamento para ser desbloqueado.",
          info: "Para desbloquear, o usuário deve realizar um pagamento através do sistema de checkout."
        },
        { status: 400 }
      )
    }

    // Bloquear usuário: definir has_active_subscription = false
    // Também cancelar subscriptions ativas
    const { data: updatedProfile, error: updateError } = await (adminClient
      .from('profiles') as any)
      .update({ 
        has_active_subscription: false, // Bloquear
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao bloquear usuário:', updateError)
      return NextResponse.json(
        { error: "Erro ao bloquear usuário", details: updateError.message },
        { status: 500 }
      )
    }

    // Cancelar subscriptions ativas do usuário
    try {
      await (adminClient.from('subscriptions') as any)
        .update({ 
          status: 'canceled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('status', ['active', 'trial'])
    } catch (subError) {
      console.warn('⚠️ Erro ao cancelar subscriptions (não crítico):', subError)
    }

    return NextResponse.json({
      success: true,
      message: "Usuário bloqueado com sucesso. Ele precisará fazer um novo pagamento para ser desbloqueado.",
      profile: updatedProfile
    })

  } catch (error: any) {
    console.error('Erro ao bloquear/desbloquear usuário:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar status do usuário" },
      { status: 500 }
    )
  }
}

