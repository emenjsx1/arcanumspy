import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CLIENT_ID = '9f903862-a780-440d-8ed5-b8d8090b180e'
// Token atualizado fornecido pelo usuário (válido até 2025-09-23)
const DEFAULT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5ZjkwMzg2Mi1hNzgwLTQ0MGQtOGVkNS1iOGQ4MDkwYjE4MGUiLCJqdGkiOiIxNTdmMTM4NDZiNjUwMDUxYzg3ODQ1NDc5ZjQ4NmQwNGU5MDIxMTBmOWNjNDJlNWNlMmQxOTg3ZjQ0Y2MzOThiM2VmYjYyYmI4OWNiYjk5NSIsImlhdCI6MTc1NDg2MzIzMS41MjQ0NDksIm5iZiI6MTc1NDg2MzIzMS41MjQ0NTEsImV4cCI6MTc4NjM5OTIzMS41MjE1MDMsInN1YiI6IiIsInNjb3BlcyI6W119.sSGP5ncLSw-OOp3hW7YQpFtXcXqnheEIAt1G3Nn8-v-ajgtyV8EE9yrbV_rLlTHvMZfs7p-0VNe8yrWXLwWj8CPgyVFzutX918uEdPHODz-osU8ROYWE5-IMrADwuQ8JA1IHQZKXp9jj41bxVhYqcvMmBrH_Tt2tKKa4JHunYlD_xgjWgNLmHArq31J5iyC8_jNR6LWDTqx7ohWX0LIuQ3mXfl8WKFAmx06YzWHWG4kNFLZZzsd1e-UVP_WqmTQ-ptX_nOA3AelV5xFJGM_i__cghWM3TQUX6Wx4JD3YolHyU3C7G7Z6HtFQ-_Jb2JE4kHZGMmu-85NJgcQS6FbVIkI6ZWSoWI_DsjtdkYMo-Sbz4m-9rYPRXVocsz0rSAMeV-BQkm6Vh-ux7a5j677eumdvz6Osdp08BjpkJ25ZHN6wQru0JCjSCiTasfY7BPYxdWi4JWD4Xec4Ssvi1XzD2M7_pQ_QJ0JGaWyU3jez4IpYyFjw7CZO7aWi-SAFZPNuXZ04V0qXqmpVH-2Q5w7O29-zdkEYwvmJfPcokFGzRJpvseXxfxnOSjHuZxOAJ_J8aBXRyswXfz0ID3xqWjzj53wvVOCjowzMBrfMYJeR4u72ODxO2zey0E3Lux7zdTBCbqLB5J45DmACfWmXY1G9--bIbBq4lSTIcqwrkXbV9pM'
const MPESA_WALLET_ID = '993607'
const EMOLA_WALLET_ID = '993606'

export async function POST(request: NextRequest) {
  try {
    let user = null
    let authError: any = null
    
    // Primeiro tentar via cookies
    const supabase = await createClient()
    const { data: { user: userFromCookies }, error: cookieError } = await supabase.auth.getUser()
    
    if (userFromCookies && !cookieError) {
      user = userFromCookies
    } else {
      authError = cookieError
      // Se não conseguir via cookies, tentar via header
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        
        try {
          // Validar token diretamente com Supabase (seguindo padrão de outras APIs)
          const supabaseModule = await import('@supabase/supabase-js')
          const createSupabaseClient = supabaseModule.createClient
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          
          if (!supabaseUrl || !supabaseAnonKey) {
            authError = new Error('Configuração inválida')
          } else {
            // Criar cliente com token no header global (padrão usado em outras APIs)
            const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            })
            
            const { data: { user: userFromToken }, error: tokenError } = await tempClient.auth.getUser(token)
            
            if (userFromToken && !tokenError) {
              user = userFromToken
              authError = null
            } else {
              authError = tokenError || new Error('Token inválido')
            }
          }
        } catch (error: any) {
          authError = error
        }
      } else {
        authError = new Error('Token não encontrado')
      }
    }

    if (!user) {
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

        // Criar assinatura
        const adminClient = createAdminClient()
        const now = new Date()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (months * 30))

        // Buscar ou criar plan_id (usar um plano padrão se não existir)
        let planId: string | null = null
        
        const { data: defaultPlan } = await (adminClient
          .from('plans') as any)
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        planId = defaultPlan?.id || null

        // Criar subscription usando apenas campos que existem na tabela original
        let subscription: any = null
        
        // Garantir que temos um plan_id
        if (!planId) {
          const { data: defaultPlanData } = await (adminClient
            .from('plans') as any)
            .select('id')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle()
          planId = defaultPlanData?.id || null
        }

        if (planId) {
          const subscriptionData: any = {
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            started_at: now.toISOString(),
            current_period_end: expiresAt.toISOString(),
          }

          try {
            // Tentar upsert (atualizar se existir, criar se não)
            const { data: subData, error: subError } = await (adminClient
              .from('subscriptions') as any)
              .upsert(subscriptionData, { onConflict: 'user_id' })
              .select()
              .single()

            if (!subError && subData) {
              subscription = subData
            }
          } catch (err) {
            // Continuar mesmo se subscription falhar
          }
        }

        // Registrar pagamento (usar estrutura que existe)
        if (planId) {
          const paymentData: any = {
            user_id: user.id,
            plan_id: planId,
            amount_cents: Math.round(amountNum * 100), // Converter para centavos
            currency: 'MZN',
            status: 'completed', // ou 'confirmed' dependendo do enum
            provider: method === 'mpesa' ? 'mpesa' : 'emola',
            external_id: transactionId,
            paid_at: now.toISOString(),
            period_start: now.toISOString(),
            period_end: expiresAt.toISOString(),
          }

          if (subscription?.id) {
            paymentData.subscription_id = subscription.id
          }

          try {
            await (adminClient
              .from('payments') as any)
              .insert(paymentData)
          } catch (paymentError: any) {
            // Se tabela não existe ou tem estrutura diferente, pular
            if (paymentError?.code !== 'PGRST205') {
              // Outro tipo de erro - tentar com estrutura básica
              try {
                const basicPayment = {
                  user_id: user.id,
                  plan_id: planId,
                  amount_cents: Math.round(amountNum * 100),
                  currency: 'MZN',
                  status: 'completed',
                  paid_at: now.toISOString(),
                }
                await (adminClient.from('payments') as any).insert(basicPayment)
              } catch (e) {
                // Ignorar se ainda falhar
              }
            }
          }
        }

        // Atualizar perfil para ativar conta e adicionar data de término
        await (adminClient
          .from('profiles') as any)
          .update({
            has_active_subscription: true,
            subscription_ends_at: expiresAt.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', user.id)

        // Enviar email de confirmação com data de término
        try {
          const { data: profile } = await (adminClient
            .from('profiles') as any)
            .select('name, email')
            .eq('id', user.id)
            .single()

          if (profile?.email) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/payment-confirmation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: profile.email,
                name: profile.name || user.email,
                plan: plan,
                amount: amountNum,
                expiresAt: expiresAt.toISOString(),
                transactionId: transactionId,
              }),
            }).catch(() => {
              // Ignorar erro de email
            })
          }
        } catch (emailError) {
          // Ignorar erro de email
        }

        return NextResponse.json({
          success: true,
          transaction_id: transactionId,
          reference: responseData.reference || cleanReference,
          message: 'Pagamento processado com sucesso. Sua conta foi ativada.',
        })
      } else {
        // Mensagens específicas para diferentes erros
        let errorMessage = 'Erro ao processar pagamento. Tente novamente.'
        let errorType = 'api_external_error'
        
        if (apiResponse.status === 401) {
          errorMessage = 'Erro de autenticação. Tente novamente mais tarde.'
          errorType = 'token_expired'
        } else if (apiResponse.status === 422) {
          // Erro 422 = Saldo insuficiente
          errorMessage = 'Saldo insuficiente na sua conta. Por favor, recarregue sua conta M-Pesa/e-Mola e tente novamente.'
          errorType = 'insufficient_balance'
        } else if (apiResponse.status === 400) {
          // Erro 400 = PIN não confirmado ou incorreto
          errorMessage = 'PIN não confirmado. Por favor, confirme o pagamento no seu celular inserindo o PIN.'
          errorType = 'pin_error'
        }
        
        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            status: apiResponse.status,
            error_type: errorType
          },
          { status: apiResponse.status }
        )
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Tempo de espera excedido. Tente novamente.',
            error_type: 'timeout'
          },
          { status: 408 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Erro ao conectar com a API de pagamento. Tente novamente.',
          error_type: 'network_error'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar pagamento. Tente novamente.',
        status: 500,
      },
      { status: 500 }
    )
  }
}

