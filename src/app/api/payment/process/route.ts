import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CLIENT_ID = '9f903862-a780-440d-8ed5-b8d8090b180e'
const DEFAULT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5ZjkwMzg2Mi1hNzgwLTQ0MGQtOGVkNS1iOGQ4MDkwYjE4MGUiLCJqdGkiOiIzMjI0ZTdiZWJmOTY3MDc4OWE4MWUyZWUwMDg2ZTY2MmM4NTYxYjlkY2UxNzVjZGQzNTk2ODBjYTU2NTU0OGNlY2Q2YTIxZjJiMWJjMTQ0YiIsImlhdCI6MTc1NTYwNzI2Ni41MjcyNzgsIm5iZiI6MTc1NTYwNzI2Ni41MjcyODEsImV4cCI6MTc4NzE0MzI2Ni41MjM2Nywic3ViIjoiIiwic2NvcGVzIjpbXX0.NEJzqLOaMnaI4iq3OMhhXAYLHDFY_JAq45JiQVfrJDoXQVcrVR0hD0tGslRUfyn-UA6gst5CXDBbeJc4l7C8FDxJYKQffbl_w12AwLQMj0wOoV9zp_dLSsgjwbwwyoyOWaP0WXMfLZOglZI2uW1tlN00uk17gZzLjtyE2M5TWPdwsaFyMkb6PpquQNB7hAnoOYWLYza66ME7F7rP7uv0qJ1w-PIj6MsjHy8ar5Dm67ISicu0sSi1WS_8XIxVAOX1zlHUQweQTvlOQILN9W1tc2-F0mRMPxAoNwOLd641puUikL33-f5Dt0hPFceKXIM6E4hCqQX4Vgq1KMYtFNdCahqFqbjupTbQPESCXEK1coGtS76p7ArsyOZALreo18xZqvJ0wQF4XYl0qab7rvbFmypDQU19R3bEsW4rAH84g9WspdF86TNZeqefqQ3JqGgqis7FekC-wdWhS3qnM5CElzLmGNpnyqHJ7lHMDuup9ejWHjNtG64E2QqCnj6UA_ACCo14LFdReT2RAySXi58Mvv8bb47XpT1xPNFBzRGQq6u9WZCHFyO07tCPmBBeinS4oElkG1upXRvE8pO7U3plzmkBOTByMDmSnBXcFDOadwym7LYfk7SYqWSSN9-0k0kFdt8gsQpAmtKCrs_hbfihhccfbHhf4HHis23W7-kTCUs'
const MPESA_WALLET_ID = '993607'
const EMOLA_WALLET_ID = '993606'

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, phone, method, reference, plan, months } = body

    // Validações
    if (!['mpesa', 'emola'].includes(method)) {
      return NextResponse.json(
        { success: false, message: 'Método de pagamento inválido' },
        { status: 400 }
      )
    }

    const phoneDigits = phone.replace(/\D/g, '')
    if (!/^(84|85|86|87)\d{7}$/.test(phoneDigits)) {
      return NextResponse.json(
        { success: false, message: 'Telefone inválido. Use um número válido de Moçambique (84, 85, 86 ou 87) com 9 dígitos' },
        { status: 400 }
      )
    }

    const amountNum = Number(amount)
    if (amountNum < 1 || isNaN(amountNum)) {
      return NextResponse.json(
        { success: false, message: 'Valor mínimo é 1 MZN' },
        { status: 400 }
      )
    }

    // Limpar referência
    let cleanReference = reference.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20)
    if (!cleanReference) {
      cleanReference = `Payment-${Date.now()}`
    }

    // Obter credenciais
    const accessToken = DEFAULT_TOKEN
    const walletId = method === 'mpesa' ? MPESA_WALLET_ID : EMOLA_WALLET_ID

    // Montar URL da API
    const apiUrl = `https://mpesaemolatech.com/v1/c2b/${method}-payment/${walletId}`

    // Fazer requisição para API e-Mola/M-Pesa
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    try {
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          amount: amountNum,
          phone: phoneDigits,
          reference: cleanReference,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseData = await apiResponse.json()

      if (apiResponse.status === 200 || apiResponse.status === 201) {
        const transactionId = responseData.transaction_id || responseData.reference || responseData.id || cleanReference

        // Criar assinatura
        const adminClient = createAdminClient()
        const now = new Date()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (months * 30))

        // Buscar ou criar plan_id (usar um plano padrão se não existir)
        const { data: defaultPlan } = await (adminClient
          .from('plans') as any)
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        const planId = defaultPlan?.id || null

        // Criar subscription
        const subscriptionData: any = {
          user_id: user.id,
          plan_name: plan,
          price: amountNum,
          is_trial: false,
          status: 'active',
          created_at: now.toISOString(),
          trial_ends_at: expiresAt.toISOString(),
          current_period_end: expiresAt.toISOString(),
        }

        if (planId) {
          subscriptionData.plan_id = planId
        }

        const { data: subscription, error: subError } = await (adminClient
          .from('subscriptions') as any)
          .insert(subscriptionData)
          .select()
          .single()

        if (subError) {
          console.error('Erro ao criar subscription:', subError)
        }

        // Registrar pagamento
        const paymentData: any = {
          user_id: user.id,
          amount: amountNum,
          status: 'confirmed',
          payment_type: 'subscription',
          method: method,
          transaction_id: transactionId,
          notes: `Pagamento da assinatura ${plan} - ${months} meses`,
          payment_date: now.toISOString(),
        }

        if (planId) {
          paymentData.plan_id = planId
        }

        if (subscription?.id) {
          paymentData.subscription_id = subscription.id
        }

        const { error: paymentError } = await (adminClient
          .from('payments') as any)
          .insert(paymentData)

        if (paymentError) {
          console.error('Erro ao registrar pagamento:', paymentError)
        }

        // Atualizar perfil para ativar conta
        await (adminClient
          .from('profiles') as any)
          .update({
            updated_at: now.toISOString(),
          })
          .eq('id', user.id)

        return NextResponse.json({
          success: true,
          transaction_id: transactionId,
          reference: responseData.reference || cleanReference,
          message: 'Pagamento processado com sucesso. Sua conta foi ativada.',
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: responseData.message || responseData.error || 'Erro ao processar pagamento',
            status: apiResponse.status,
            details: responseData,
          },
          { status: apiResponse.status }
        )
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { success: false, message: 'Tempo de espera excedido. Tente novamente.' },
          { status: 408 }
        )
      }

      throw fetchError
    }
  } catch (error: any) {
    console.error('Erro ao processar pagamento:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Erro ao processar pagamento',
        status: 500,
      },
      { status: 500 }
    )
  }
}

