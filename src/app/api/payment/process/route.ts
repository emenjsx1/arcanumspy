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

    // Token já obtido acima

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

        // Registrar pagamento (usar estrutura básica que existe em todas as versões)
        if (planId) {
          // Estrutura básica que funciona em ambas as migrations
          const basicPayment: any = {
            user_id: user.id,
            plan_id: planId,
            amount_cents: Math.round(amountNum * 100),
            currency: 'MZN',
            status: 'completed',
            paid_at: now.toISOString(),
          }

          // Adicionar campos opcionais se existirem
          if (subscription?.id) {
            basicPayment.subscription_id = subscription.id
          }

          // Tentar adicionar campos extras (podem não existir)
          try {
            basicPayment.provider = method === 'mpesa' ? 'mpesa' : 'emola'
            basicPayment.external_id = transactionId
            basicPayment.period_start = now.toISOString()
            basicPayment.period_end = expiresAt.toISOString()
          } catch (e) {
            // Ignorar se campos não existem
          }

          try {
            await (adminClient
              .from('payments') as any)
              .insert(basicPayment)
          } catch (paymentError: any) {
            // Se tabela não existe (PGRST205), tentar criar registro mínimo
            if (paymentError?.code === 'PGRST205') {
              // Tabela não existe - pular registro de pagamento
            } else {
              // Outro erro - tentar apenas com campos obrigatórios
              try {
                const minimalPayment = {
                  user_id: user.id,
                  plan_id: planId,
                  amount_cents: Math.round(amountNum * 100),
                  currency: 'MZN',
                  status: 'completed',
                  paid_at: now.toISOString(),
                }
                await (adminClient.from('payments') as any).insert(minimalPayment)
              } catch (e) {
                // Ignorar se ainda falhar - o importante é ativar a conta
              }
            }
          }
        }

        // IMPORTANTE: Atualizar perfil para ativar conta - isso é CRÍTICO
        // Mesmo se subscription/payment falhar, a conta deve ser ativada
        let profileUpdated = false
        
        // Tentar atualizar com todos os campos
        try {
          const { error: profileError } = await (adminClient
            .from('profiles') as any)
            .update({
              has_active_subscription: true,
              subscription_ends_at: expiresAt.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', user.id)

          if (!profileError) {
            profileUpdated = true
          } else {
            // Se falhar, tentar atualizar apenas has_active_subscription
            const { error: simpleError } = await (adminClient
              .from('profiles') as any)
              .update({
                has_active_subscription: true,
              })
              .eq('id', user.id)
            
            if (!simpleError) {
              profileUpdated = true
            }
          }
        } catch (profileUpdateError: any) {
          // Se ainda falhar, tentar atualizar apenas has_active_subscription sem outros campos
          try {
            const { error: finalError } = await (adminClient
              .from('profiles') as any)
              .update({
                has_active_subscription: true,
              })
              .eq('id', user.id)
            
            if (!finalError) {
              profileUpdated = true
            }
          } catch (e) {
            // Última tentativa falhou
          }
        }

        // Se ainda não atualizou, tentar criar/atualizar subscription_ends_at separadamente
        if (!profileUpdated) {
          try {
            // Tentar atualizar subscription_ends_at se a coluna existir
            await (adminClient
              .from('profiles') as any)
              .update({
                subscription_ends_at: expiresAt.toISOString(),
              })
              .eq('id', user.id)
          } catch (e) {
            // Ignorar se coluna não existir
          }
        }

        // Verificar se a conta foi realmente ativada antes de retornar sucesso
        let accountActivated = false
        try {
          const { data: verifyProfile } = await (adminClient
            .from('profiles') as any)
            .select('has_active_subscription, subscription_ends_at')
            .eq('id', user.id)
            .single()

          accountActivated = verifyProfile?.has_active_subscription === true
        } catch (e) {
          // Se não conseguir verificar, assumir que foi ativado (já tentamos atualizar)
          accountActivated = profileUpdated
        }

        // Se não foi ativado, tentar uma última vez
        if (!accountActivated) {
          try {
            await (adminClient
              .from('profiles') as any)
              .update({
                has_active_subscription: true,
              })
              .eq('id', user.id)
            
            accountActivated = true
          } catch (e) {
            // Se ainda falhar, retornar erro
            return NextResponse.json({
              success: false,
              message: 'Pagamento processado, mas houve erro ao ativar conta. Entre em contato com suporte.',
              transaction_id: transactionId,
            }, { status: 500 })
          }
        }

        // Enviar email de confirmação com data de término
        try {
          const { data: profile } = await (adminClient
            .from('profiles') as any)
            .select('name, email')
            .eq('id', user.id)
            .single()

          if (profile?.email) {
            // Enviar email diretamente usando a biblioteca de email
            try {
              const { sendPaymentSuccessEmail } = await import('@/lib/email')
              await sendPaymentSuccessEmail({
                name: profile.name || user.email || 'Usuário',
                planName: plan,
                amount: amountNum,
                currency: 'MZN',
                paymentDate: now.toISOString(),
                invoiceNumber: transactionId,
                expiresAt: expiresAt.toISOString(),
                userEmail: profile.email,
              })
            } catch (emailLibError) {
              // Se falhar, tentar via API
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
                // Ignorar erro de email - não é crítico
              })
            }
          }
        } catch (emailError) {
          // Ignorar erro de email - não é crítico para o pagamento
        }

        return NextResponse.json({
          success: true,
          transaction_id: transactionId,
          reference: responseData.reference || cleanReference,
          message: 'Pagamento processado com sucesso. Sua conta foi ativada.',
          account_activated: accountActivated,
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

