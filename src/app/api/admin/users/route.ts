import { NextRequest, NextResponse } from "next/server"
import { getAllUsers } from "@/lib/db/admin/users"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '0', 10)
    
    
    // Usar a função getAllUsers que já tem tratamento de erro e busca todos os usuários
    const users = await getAllUsers()
    
    // Se houver limite, aplicar
    const limitedUsers = limit > 0 ? users.slice(0, limit) : users
    
    // Buscar informações de pagamento e bloqueio para cada usuário
    const adminClient = createAdminClient()
    const userIds = limitedUsers.map(u => u.id)
    
    // Buscar pagamentos confirmados (paid ou completed) com informações do plano
    const { data: payments } = await adminClient
      .from('payments')
      .select(`
        user_id, 
        status, 
        paid_at,
        plan:plans(id, name, slug)
      `)
      .in('user_id', userIds)
      .in('status', ['paid', 'completed'])
      .order('paid_at', { ascending: false })
      .order('created_at', { ascending: false })
    
    // Criar mapa de usuários que pagaram e seus planos
    const usersWithPayment = new Set(
      (payments || []).map((p: any) => p.user_id)
    )
    
    // Criar mapa do plano mais recente de cada usuário que pagou
    const userPlanMap = new Map()
    ;(payments || []).forEach((p: any) => {
      if (!userPlanMap.has(p.user_id) && p.plan) {
        userPlanMap.set(p.user_id, p.plan)
      }
    })
    
    // Buscar informações de bloqueio (banned) dos profiles
    const { data: profilesWithBanned } = await adminClient
      .from('profiles')
      .select('id, banned')
      .in('id', userIds)
    
    const bannedUsers = new Set(
      (profilesWithBanned || [])
        .filter((p: any) => p.banned === true)
        .map((p: any) => p.id)
    )
    
    const totalTime = Date.now() - startTime

    // Buscar subscriptions com informações de expiração
    const { data: subscriptions } = await adminClient
      .from('subscriptions')
      .select(`
        user_id,
        status,
        current_period_end,
        trial_ends_at,
        plan:plans(id, name, slug)
      `)
      .in('user_id', userIds)
    
    // Criar mapa de subscriptions por usuário
    const subscriptionMap = new Map()
    ;(subscriptions || []).forEach((sub: any) => {
      subscriptionMap.set(sub.user_id, sub)
    })
    
    // Mapear para o formato esperado pela página com informações de pagamento e bloqueio
    const mappedUsers = limitedUsers.map(user => {
      const hasPaid = usersWithPayment.has(user.id)
      const isBanned = bannedUsers.has(user.id)
      
      // Determinar o plano: priorizar plano do pagamento, depois subscription, depois free
      const paymentPlan = userPlanMap.get(user.id)
      const subscription = subscriptionMap.get(user.id) || user.subscription || null
      const subscriptionPlan = subscription?.plan
      
      let finalPlan = paymentPlan || subscriptionPlan || { name: 'Free', slug: 'free' }
      
      // Determinar status
      let status = 'active'
      let statusLabel = 'Ativo'
      
      if (isBanned) {
        status = 'banned'
        statusLabel = 'Bloqueado'
      } else if (!hasPaid) {
        status = 'unpaid'
        statusLabel = 'Pagamento Pendente'
      } else {
        status = 'paid'
        statusLabel = 'Pago'
      }
      
      return {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number || null,
        email: user.email || null,
        role: user.role,
        created_at: user.created_at,
        subscription: {
          ...subscription,
          plan: finalPlan,
          current_period_end: subscription?.current_period_end || subscription?.trial_ends_at || null,
        },
        has_paid: hasPaid,
        is_banned: isBanned,
        status: status,
        status_label: statusLabel,
      }
    })

    return NextResponse.json({ users: mappedUsers })
  } catch (error: any) {
    console.error('❌ [API Admin Users] Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

