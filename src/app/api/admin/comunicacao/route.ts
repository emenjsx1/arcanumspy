import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { 
  getAdminNewsletterEmail, 
  getAdminPaymentOverdueEmail,
  getAdminNewFeatureEmail,
  getAdminAccountExpiringEmail,
  getAdminTrialEndingEmail
} from '@/lib/email/admin-templates'
import { ensureArray } from '@/lib/supabase-utils'
import type { ProfileBasic, UserBasic } from '@/types/schemas'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se não encontrou usuário via cookies, tentar via Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
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

    // Verificar se é admin usando adminClient para bypass RLS
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError: any) {
      console.error('Erro ao criar admin client:', adminError)
      return NextResponse.json(
        { error: adminError.message || "Erro de configuração do servidor" },
        { status: 500 }
      )
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        { error: "Erro ao verificar permissões" },
        { status: 500 }
      )
    }

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado. Apenas administradores podem acessar este endpoint." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      emailType, 
      userIds, 
      subject, 
      message, 
      ctaText, 
      ctaUrl,
      // Para pagamentos atrasados
      amount,
      currency,
      dueDate,
      invoiceNumber,
      paymentUrl
    } = body

    if (!emailType || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "emailType e userIds são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar perfis com subscriptions (para obter informações do plano)
    const { data: profilesRaw, error: profilesError } = await adminClient
      .from('profiles')
      .select(`
        id, 
        name,
        subscriptions(
          plan:plans(name, slug)
        )
      `)
      .in('id', userIds)

    // Tratar erro do Supabase
    if (profilesError) {
      console.error('Supabase profiles error', profilesError)
      return NextResponse.json(
        { error: "Erro ao buscar usuários: " + profilesError.message },
        { status: 500 }
      )
    }

    // Garantir array e tipar
    const profiles = ensureArray<ProfileBasic>(profilesRaw)

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "Nenhum usuário encontrado" },
        { status: 400 }
      )
    }

    // Buscar emails de auth.users para cada perfil e incluir subscriptions
    const users: (UserBasic & { subscriptions?: any[] })[] = await Promise.all(
      profiles.map(async (profile: any) => {
        try {
          const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id)
          return {
            id: profile.id,
            name: profile.name || null,
            email: authUser?.user?.email || null,
            subscriptions: profile.subscriptions || [],
          } as UserBasic & { subscriptions?: any[] }
        } catch (error) {
          console.warn(`Erro ao buscar email para usuário ${profile.id}:`, error)
          return {
            id: profile.id,
            name: profile.name || null,
            email: null,
            subscriptions: profile.subscriptions || [],
          } as UserBasic & { subscriptions?: any[] }
        }
      })
    )

    // Filtrar usuários com email válido
    const usersWithValidEmail = users.filter(u => u.email && u.email.trim() !== '')

    if (usersWithValidEmail.length === 0) {
      return NextResponse.json(
        { error: "Nenhum usuário com email válido encontrado" },
        { status: 400 }
      )
    }

    // Enviar emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const user of usersWithValidEmail) {
      try {
        let html = ''
        let emailSubject = subject || 'ArcanumSpy'

        if (emailType === 'newsletter') {
          if (!message) {
            results.errors.push(`Usuário ${user.name}: mensagem é obrigatória`)
            results.failed++
            continue
          }
          html = getAdminNewsletterEmail({
            name: user.name || 'Usuário',
            subject: emailSubject,
            message,
            ctaText,
            ctaUrl
          })
        } else if (emailType === 'payment_overdue') {
          if (!amount || !dueDate) {
            results.errors.push(`Usuário ${user.name}: amount e dueDate são obrigatórios`)
            results.failed++
            continue
          }
          
          // Sempre incluir link de renovação
          const renewalUrl = paymentUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/billing?renew=true&user=${user.id}`
          
          // Buscar nome do plano do usuário se disponível
          let planName = 'Plano Atual'
          if (user.subscriptions && Array.isArray(user.subscriptions) && user.subscriptions.length > 0) {
            const sub = user.subscriptions[0]
            if (sub.plan && sub.plan.name) {
              planName = sub.plan.name
            }
          } else if ((user as any).subscription && (user as any).subscription.plan && (user as any).subscription.plan.name) {
            planName = (user as any).subscription.plan.name
          }
          
          html = getAdminPaymentOverdueEmail({
            name: user.name || 'Usuário',
            amount,
            currency: currency || 'MZN',
            dueDate,
            invoiceNumber,
            paymentUrl,
            renewalUrl, // Sempre incluir link de renovação
            planName
          })
          emailSubject = '⚠️ Pagamento Atrasado - Renove Sua Conta Agora - ArcanumSpy'
        } else if (emailType === 'new_feature') {
          if (!message) {
            results.errors.push(`Usuário ${user.name}: mensagem é obrigatória`)
            results.failed++
            continue
          }
          html = getAdminNewFeatureEmail({
            name: user.name || 'Usuário',
            featureName: subject || 'Nova Funcionalidade',
            featureDescription: message,
            ctaText: ctaText || 'Explorar Agora',
            ctaUrl: ctaUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/dashboard`,
            benefits: message.split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'))
          })
          emailSubject = subject || '✨ Nova Funcionalidade - ArcanumSpy'
        } else if (emailType === 'account_expiring') {
          if (!dueDate) {
            results.errors.push(`Usuário ${user.name}: dueDate é obrigatório`)
            results.failed++
            continue
          }
          const renewalUrl = ctaUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/billing?renew=true&user=${user.id}`
          let planName = 'Plano Atual'
          if (user.subscriptions && Array.isArray(user.subscriptions) && user.subscriptions.length > 0) {
            const sub = user.subscriptions[0]
            if (sub.plan && sub.plan.name) {
              planName = sub.plan.name
            }
          } else if ((user as any).subscription && (user as any).subscription.plan && (user as any).subscription.plan.name) {
            planName = (user as any).subscription.plan.name
          }
          html = getAdminAccountExpiringEmail({
            name: user.name || 'Usuário',
            planName,
            expiresAt: dueDate,
            renewalUrl
          })
          emailSubject = '⏰ Sua Conta Expira em Breve - ArcanumSpy'
        } else if (emailType === 'trial_ending') {
          if (!dueDate) {
            results.errors.push(`Usuário ${user.name}: dueDate é obrigatório`)
            results.failed++
            continue
          }
          const upgradeUrl = ctaUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/billing?upgrade=true&user=${user.id}`
          let planName = 'Plano Trial'
          if (user.subscriptions && Array.isArray(user.subscriptions) && user.subscriptions.length > 0) {
            const sub = user.subscriptions[0]
            if (sub.plan && sub.plan.name) {
              planName = sub.plan.name
            }
          } else if ((user as any).subscription && (user as any).subscription.plan && (user as any).subscription.plan.name) {
            planName = (user as any).subscription.plan.name
          }
          html = getAdminTrialEndingEmail({
            name: user.name || 'Usuário',
            planName,
            trialEndsAt: dueDate,
            upgradeUrl
          })
          emailSubject = '🎁 Seu Trial Termina em Breve - ArcanumSpy'
        } else {
          results.errors.push(`Tipo de email inválido: ${emailType}`)
          results.failed++
          continue
        }

        const result = await sendEmail({
          to: user.email!,
          subject: emailSubject,
          html,
        })

        if (result.success) {
          results.sent++
        } else {
          results.failed++
          results.errors.push(`Usuário ${user.name}: ${result.error || 'Erro desconhecido'}`)
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`Usuário ${user.name}: ${error.message || 'Erro ao enviar email'}`)
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        total: usersWithValidEmail.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors
      }
    })
  } catch (error: any) {
    console.error('Erro ao enviar emails:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

