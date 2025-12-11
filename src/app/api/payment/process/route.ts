import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CLIENT_ID = '9f903862-a780-440d-8ed5-b8d8090b180e'
const DEFAULT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5ZjkwMzg2Mi1hNzgwLTQ0MGQtOGVkNS1iOGQ4MDkwYjE4MGUiLCJqdGkiOiIzMjI0ZTdiZWJmOTY3MDc4OWE4MWUyZWUwMDg2ZTY2MmM4NTYxYjlkY2UxNzVjZGQzNTk2ODBjYTU2NTU0OGNlY2Q2YTIxZjJiMWJjMTQ0YiIsImlhdCI6MTc1NTYwNzI2Ni41MjcyNzgsIm5iZiI6MTc1NTYwNzI2Ni41MjcyODEsImV4cCI6MTc4NzE0MzI2Ni41MjM2Nywic3ViIjoiIiwic2NvcGVzIjpbXX0.NEJzqLOaMnaI4iq3OMhhXAYLHDFY_JAq45JiQVfrJDoXQVcrVR0hD0tGslRUfyn-UA6gst5CXDBbeJc4l7C8FDxJYKQffbl_w12AwLQMj0wOoV9zp_dLSsgjwbwwyoyOWaP0WXMfLZOglZI2uW1tlN00uk17gZzLjtyE2M5TWPdwsaFyMkb6PpquQNB7hAnoOYWLYza66ME7F7rP7uv0qJ1w-PIj6MsjHy8ar5Dm67ISicu0sSi1WS_8XIxVAOX1zlHUQweQTvlOQILN9W1tc2-F0mRMPxAoNwOLd641puUikL33-f5Dt0hPFceKXIM6E4hCqQX4Vgq1KMYtFNdCahqFqbjupTbQPESCXEK1coGtS76p7ArsyOZALreo18xZqvJ0wQF4XYl0qab7rvbFmypDQU19R3bEsW4rAH84g9WspdF86TNZeqefqQ3JqGgqis7FekC-wdWhS3qnM5CElzLmGNpnyqHJ7lHMDuup9ejWHjNtG64E2QqCnj6UA_ACCo14LFdReT2RAySXi58Mvv8bb47XpT1xPNFBzRGQq6u9WZCHFyO07tCPmBBeinS4oElkG1upXRvE8pO7U3plzmkBOTByMDmSnBXcFDOadwym7LYfk7SYqWSSN9-0k0kFdt8gsQpAmtKCrs_hbfihhccfbHhf4HHis23W7-kTCUs'
const MPESA_WALLET_ID = '993607'
const EMOLA_WALLET_ID = '993606'

export async function POST(request: NextRequest) {
  try {
    let user = null
    let authError: any = null
    
    // Primeiro tentar via cookies
    const supabase = await createClient()
    const { data: { user: userFromCookies }, error: cookieError } = await supabase.auth.getUser()
    
    console.log('🔐 [Payment API] Tentativa de autenticação via cookies:', {
      hasUser: !!userFromCookies,
      hasError: !!cookieError,
      errorMessage: cookieError?.message
    })
    
    if (userFromCookies && !cookieError) {
      user = userFromCookies
      console.log('✅ [Payment API] Usuário autenticado via cookies:', user.id)
    } else {
      authError = cookieError
      // Se não conseguir via cookies, tentar via header
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      console.log('🔐 [Payment API] Tentando autenticação via header:', {
        hasHeader: !!authHeader,
        headerPrefix: authHeader?.substring(0, 20) + '...'
      })
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        console.log('🔑 [Payment API] Token extraído:', {
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...'
        })
        
        try {
          // Validar token diretamente com Supabase (seguindo padrão de outras APIs)
          const supabaseModule = await import('@supabase/supabase-js')
          const createSupabaseClient = supabaseModule.createClient
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          
          if (!supabaseUrl || !supabaseAnonKey) {
            console.error('⚠️ [Payment API] Variáveis de ambiente do Supabase não configuradas')
            authError = new Error('Variáveis de ambiente do Supabase não configuradas')
          } else {
            console.log('🔧 [Payment API] Criando cliente Supabase temporário...')
            
            // Criar cliente com token no header global (padrão usado em outras APIs)
            const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            })
            
            console.log('🔍 [Payment API] Validando token com getUser()...')
            const { data: { user: userFromToken }, error: tokenError } = await tempClient.auth.getUser(token)
            
            console.log('📊 [Payment API] Resultado da validação:', {
              hasUser: !!userFromToken,
              hasError: !!tokenError,
              errorMessage: tokenError?.message,
              errorStatus: tokenError?.status,
              userId: userFromToken?.id
            })
            
            if (userFromToken && !tokenError) {
              user = userFromToken
              authError = null
              console.log('✅ [Payment API] Usuário autenticado via token:', user.id)
            } else {
              console.error('⚠️ [Payment API] Erro ao validar token:', {
                message: tokenError?.message || 'Token inválido',
                status: tokenError?.status,
                name: tokenError?.name
              })
              authError = tokenError || new Error('Token inválido')
            }
          }
        } catch (error: any) {
          console.error('⚠️ [Payment API] Erro ao criar cliente temporário:', {
            message: error.message || error,
            stack: error.stack
          })
          authError = error
        }
      } else {
        console.warn('⚠️ [Payment API] Nenhum token de autenticação encontrado no header')
        authError = new Error('Token não encontrado no header Authorization')
      }
    }

    if (!user) {
      console.error('❌ [Payment API] Usuário não autenticado. Cookie error:', authError?.message || 'Nenhum método de autenticação funcionou')
      return NextResponse.json(
        { 
          success: false, 
          message: "Não autenticado. Faça login para continuar.",
          error: authError?.message || 'Autenticação falhou'
        },
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

    // Obter credenciais (priorizar variáveis de ambiente)
    const envTokenKey = method === 'mpesa' ? 'MPESA_ACCESS_TOKEN' : 'EMOLA_ACCESS_TOKEN'
    const accessToken = process.env[envTokenKey] || DEFAULT_TOKEN
    const walletId = method === 'mpesa'
      ? (process.env.MPESA_WALLET_ID || MPESA_WALLET_ID)
      : (process.env.EMOLA_WALLET_ID || EMOLA_WALLET_ID)

    // Verificar se o token está configurado
    if (!accessToken || accessToken === DEFAULT_TOKEN) {
      console.warn('⚠️ [Payment API] Usando token padrão. Configure variável de ambiente:', envTokenKey)
    }

    // Montar URL da API
    const apiUrl = `https://mpesaemolatech.com/v1/c2b/${method}-payment/${walletId}`

    console.log('📞 [Payment API] Chamando API externa:', {
      url: apiUrl,
      method: method,
      phone: phoneDigits,
      amount: amountNum,
      reference: cleanReference,
      walletId: walletId,
      hasToken: !!accessToken,
      tokenSource: process.env[envTokenKey] ? 'env' : 'default',
      tokenLength: accessToken?.length || 0
    })

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

      console.log('📥 [Payment API] Resposta recebida:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        ok: apiResponse.ok
      })

      const responseData = await apiResponse.json()
      
      console.log('📦 [Payment API] Dados da resposta:', {
        hasTransactionId: !!responseData.transaction_id,
        hasReference: !!responseData.reference,
        message: responseData.message,
        error: responseData.error,
        fullResponse: responseData
      })

      if (apiResponse.status === 200 || apiResponse.status === 201) {
        const transactionId = responseData.transaction_id || responseData.reference || responseData.id || cleanReference
        
        console.log('✅ [Payment API] Pagamento processado com sucesso:', {
          transactionId: transactionId,
          reference: responseData.reference || cleanReference
        })

        // Criar assinatura
        const adminClient = createAdminClient()
        const now = new Date()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (months * 30))
        
        console.log('💾 [Payment API] Criando subscription e payment no banco...')

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
        console.error('❌ [Payment API] Erro da API externa:', {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          response: responseData
        })
        
        // Mensagem específica para erro 401 (token expirado/inválido)
        let errorMessage = responseData.message || responseData.error || 'Erro ao processar pagamento na API externa'
        if (apiResponse.status === 401) {
          errorMessage = 'Token de acesso à API de pagamento expirado ou inválido. Por favor, entre em contato com o suporte ou tente novamente mais tarde.'
          console.error('🔑 [Payment API] Token da API externa inválido. Verifique:', envTokenKey)
        }
        
        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            status: apiResponse.status,
            details: process.env.NODE_ENV === 'development' ? responseData : undefined,
            error_type: apiResponse.status === 401 ? 'token_expired' : 'api_external_error'
          },
          { status: apiResponse.status }
        )
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      console.error('❌ [Payment API] Erro ao chamar API externa:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack
      })
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Tempo de espera excedido. A API de pagamento não respondeu a tempo. Tente novamente.',
            error_type: 'timeout'
          },
          { status: 408 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: fetchError.message || 'Erro ao conectar com a API de pagamento',
          error_type: 'network_error',
          details: process.env.NODE_ENV === 'development' ? fetchError.message : undefined
        },
        { status: 500 }
      )
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

