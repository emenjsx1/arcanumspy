import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Configuração da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = "gpt-4o-mini" // Modelo rápido e econômico
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const WEBHOOK_URL = "https://srv-4544.cloudnuvem.net/webhook-test/copy-ia"

interface GenerateCopyRequest {
  nicho: string
  tipo_criativo: string
  modelo: string
  publico: string
  promessa: string
  prova?: string
  diferencial: string
  cta: string
}

function buildPrompt(input: GenerateCopyRequest): string {
  const modeloDescriptions: Record<string, string> = {
    'AIDA': 'Use a estrutura AIDA: Atenção, Interesse, Desejo, Ação',
    'PAS': 'Use a estrutura PAS: Problema, Agitação, Solução',
    'QPQ': 'Use a estrutura QPQ: Questão, Problema, Questão',
    '4P\'s': 'Use a estrutura 4P\'s: Promessa, Prova, Prova Social, Push',
    'Big Promise': 'Foque em uma grande promessa transformadora',
    'Storytelling': 'Conte uma história envolvente e emocional',
    'Anti-Método': 'Use o método anti-método: mostre o que NÃO fazer',
    'Lista de Benefícios': 'Liste os principais benefícios de forma clara e objetiva',
  }

  const tipoCriativoDescriptions: Record<string, string> = {
    'Vídeo UGC': 'Copy para vídeo de usuário gerando conteúdo (UGC), estilo autêntico e conversacional',
    'Vídeo Problema → Solução': 'Copy para vídeo que apresenta um problema e depois a solução',
    'Criativo imagem': 'Copy para postagem com imagem, precisa ser visual e impactante',
    'Story': 'Copy para story do Instagram, curta e direta',
    'Copy para carrossel': 'Copy para carrossel do Instagram, com múltiplos slides',
    'Copy longa': 'Copy longa e detalhada, com todos os elementos',
    'Copy curta': 'Copy curta e objetiva, direto ao ponto',
  }

  const modeloDesc = modeloDescriptions[input.modelo] || input.modelo
  const tipoDesc = tipoCriativoDescriptions[input.tipo_criativo] || input.tipo_criativo

  return `Você é um copywriter especialista em marketing digital e direct response marketing.

Crie uma copy completa seguindo estas especificações:

NICHO: ${input.nicho}
TIPO DE CRIATIVO: ${tipoDesc}
MODELO DE COPY: ${modeloDesc}
PÚBLICO-ALVO: ${input.publico}
PROMESSA PRINCIPAL: ${input.promessa}
${input.prova ? `PROVA/CREDIBILIDADE: ${input.prova}` : ''}
DIFERENCIAL: ${input.diferencial}
CTA (Chamada para Ação): ${input.cta}

IMPORTANTE:
- A copy deve ser persuasiva, envolvente e focada em conversão
- Use linguagem adequada ao público-alvo
- Siga rigorosamente a estrutura do modelo escolhido
- Adapte o tom e formato ao tipo de criativo
- Seja específico e evite clichês
- Use gatilhos mentais quando apropriado

IMPORTANTE: Você DEVE retornar APENAS um objeto JSON válido, sem markdown, sem explicações, sem texto adicional antes ou depois.

A estrutura JSON obrigatória é:
{
  "copy_principal": "A copy principal completa e formatada",
  "variacoes": ["Variação 1", "Variação 2", "Variação 3", "Variação 4", "Variação 5"],
  "headlines": ["Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5"],
  "descricao_curta": "Uma descrição curta e impactante (até 2 linhas)",
  "legenda_anuncio": "Legenda otimizada para anúncios no Facebook/Instagram"${input.tipo_criativo.includes('Vídeo') ? ',\n  "script_ugc": "Script completo para vídeo UGC com indicações de tom e pausas"' : ''}
}

Retorne SOMENTE o JSON, sem markdown code blocks, sem texto explicativo.`
}

async function generateWithOpenAI(prompt: string): Promise<any> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada')
  }

  const fullPrompt = `Você é um copywriter especialista. Sempre retorne apenas JSON válido, sem markdown, sem explicações.

${prompt}`

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Você é um copywriter especialista. Sempre retorne apenas JSON válido, sem markdown, sem explicações.'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `OpenAI API error: ${response.status}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error?.message || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Resposta vazia da API OpenAI')
  }

  // Remover markdown code blocks se existirem
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleanContent)
  } catch (e) {
    // Se falhar, tentar extrair JSON do texto
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('Não foi possível parsear a resposta da IA')
  }
}

async function sendToWebhook(data: any, userId: string): Promise<void> {
  try {
    const webhookPayload = {
      user_id: userId,
      timestamp: new Date().toISOString(),
      ...data,
    }

    // Criar AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos

    try {
      const startTime = Date.now()
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ArcanumSpy-CopyIA/1.0',
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error(`❌ Webhook retornou status ${response.status} em ${duration}ms:`)
        console.error(`   Resposta:`, errorText.substring(0, 200))
      } else {
        const responseText = await response.text().catch(() => '')
        if (responseText) {
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('❌ Webhook timeout após 10 segundos')
      } else {
        console.error('❌ Erro ao enviar webhook:', fetchError.message)
        console.error('   Stack:', fetchError.stack)
        throw fetchError
      }
    }
  } catch (error: any) {
    // Não falhar a requisição se o webhook falhar
    console.error('❌ Erro crítico ao enviar para webhook (continuando):', error.message)
  }
}

function generateMockCopy(input: GenerateCopyRequest): any {
  // Fallback caso a API não esteja configurada
  return {
    copy_principal: `[${input.modelo}] Copy para ${input.tipo_criativo} no nicho de ${input.nicho}

Público: ${input.publico}

${input.promessa}

${input.diferencial}

${input.prova ? `Prova: ${input.prova}` : ''}

${input.cta}`,
    variacoes: [
      `Variação 1: ${input.promessa} - ${input.diferencial}`,
      `Variação 2: Descubra como ${input.promessa}`,
      `Variação 3: ${input.diferencial} que transforma sua vida`,
      `Variação 4: A solução para ${input.publico}`,
      `Variação 5: ${input.promessa} agora mesmo`,
    ],
    headlines: [
      `${input.promessa} - ${input.diferencial}`,
      `Descubra o segredo de ${input.nicho}`,
      `${input.publico}: Esta é a solução`,
      `Transforme sua vida com ${input.promessa}`,
      `${input.diferencial} que você precisa`,
    ],
    descricao_curta: `${input.promessa}. ${input.diferencial}.`,
    legenda_anuncio: `${input.promessa}\n\n${input.diferencial}\n\n${input.cta}`,
    ...(input.tipo_criativo.includes('Vídeo') && {
      script_ugc: `[Tom: Conversacional e autêntico]\n\nOlá! Eu queria compartilhar com vocês sobre ${input.promessa}.\n\n${input.diferencial}\n\n${input.prova ? `Eu testei e ${input.prova}` : ''}\n\n${input.cta}`,
    }),
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const supabase = await createClient()
    
    // Tentar obter usuário de múltiplas formas
    let user = null
    let authError = null
    
    // 1. Tentar via cookies (método padrão)
    const getUserResult = await supabase.auth.getUser()
    user = getUserResult.data?.user || null
    authError = getUserResult.error
    
    // 2. Se não funcionou, tentar via header Authorization
    if (!user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
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
          authError = null
        }
      }
    }
    
    if (!user) {
      console.error('❌ Usuário não autenticado:', authError?.message)
      return NextResponse.json(
        { 
          error: "Não autenticado", 
          details: authError?.message || "Sessão não encontrada",
          hint: "Faça login novamente"
        },
        { status: 401 }
      )
    }

    const body: GenerateCopyRequest = await request.json()
    
    // Validação
    if (!body.nicho || !body.tipo_criativo || !body.modelo || !body.publico || !body.promessa || !body.diferencial || !body.cta) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    // Sistema baseado em planos - não há mais cobrança de créditos

    // 1. PRIMEIRO: ENVIAR WEBHOOK IMEDIATAMENTE (assim que clicar em Gerar Copy)
    
    // Enviar webhook de forma não bloqueante (não esperar)
    sendToWebhook({
      action: 'copy_generation_started',
      form_data: body,
      generation_id: null, // Ainda não tem ID
    }, user.id).catch(err => {
      console.error('❌ Erro ao enviar webhook inicial (não crítico):', err)
    })

    // 2. Salvar informações no banco
    const supabaseServer = await createClient()
    let savedId: string | null = null
    
    try {
      const { data: saved, error: saveError } = await (supabaseServer
        .from('copy_generations') as any)
        .insert({
          user_id: user.id,
          nicho: body.nicho,
          tipo_criativo: body.tipo_criativo,
          modelo: body.modelo,
          publico: body.publico,
          promessa: body.promessa,
          prova: body.prova || null,
          diferencial: body.diferencial,
          cta: body.cta,
          resultado: {}, // Resultado vazio inicialmente
        })
        .select()
        .single()

      if (saveError) {
        console.error('Erro ao salvar dados iniciais:', saveError)
      } else {
        savedId = saved.id
      }
    } catch (saveError: any) {
      console.error('Erro ao salvar dados iniciais:', saveError)
      // Continuar mesmo se falhar ao salvar
    }

    // 3. GERAR COPY com OpenAI
    let resultado: any
    let generationError: any = null
    
    try {
      const prompt = buildPrompt(body)
      
      if (OPENAI_API_KEY) {
        resultado = await generateWithOpenAI(prompt)
      } else {
        // Fallback para mock quando API não está configurada
        console.warn('⚠️ OPENAI_API_KEY não configurada, usando resposta mock')
        resultado = generateMockCopy(body)
      }
    } catch (error: any) {
      console.error('❌ Erro ao gerar copy com OpenAI:', error)
      generationError = error
      // SEMPRE usar fallback para garantir que retorne uma copy
      resultado = generateMockCopy(body)
    }

    // Garantir que resultado sempre tenha a estrutura correta
    if (!resultado || typeof resultado !== 'object') {
      console.warn('⚠️ Resultado inválido, usando fallback')
      resultado = generateMockCopy(body)
    }

    // Validar campos obrigatórios
    if (!resultado.copy_principal || !Array.isArray(resultado.variacoes) || !Array.isArray(resultado.headlines)) {
      console.warn('⚠️ Resultado incompleto, usando fallback')
      resultado = generateMockCopy(body)
    }

    // 4. ATUALIZAR banco com resultado
    if (savedId) {
      try {
        await (supabaseServer
          .from('copy_generations') as any)
          .update({ resultado: resultado })
          .eq('id', savedId)
        
      } catch (updateError) {
        console.error('Erro ao atualizar resultado:', updateError)
      }
    } else {
      // Se não salvou antes, tentar salvar agora com resultado
      try {
        const { data: saved, error: saveError } = await (supabaseServer
          .from('copy_generations') as any)
          .insert({
            user_id: user.id,
            nicho: body.nicho,
            tipo_criativo: body.tipo_criativo,
            modelo: body.modelo,
            publico: body.publico,
            promessa: body.promessa,
            prova: body.prova || null,
            diferencial: body.diferencial,
            cta: body.cta,
            resultado: resultado,
          })
          .select()
          .single()

        if (!saveError && saved) {
          savedId = saved.id
        }
      } catch (finalSaveError) {
        console.error('Erro ao salvar resultado final:', finalSaveError)
      }
    }

    // NOTA: Os créditos já foram debitados no início da função (5 créditos fixos)
    // Este bloco foi removido pois agora sempre cobramos 5 créditos fixos por geração

    // 5. ENVIAR RESULTADO PARA WEBHOOK
    await sendToWebhook({
      action: 'copy_generation_completed',
      form_data: body,
      generation_id: savedId,
      result: resultado,
      error: generationError ? generationError.message : null,
    }, user.id)

    // 6. SEMPRE retornar resultado (mesmo se houver erros)
    return NextResponse.json({
      success: true,
      data: resultado,
      id: savedId,
      warning: generationError ? 'Copy gerada com fallback devido a erro na API' : null,
    })
  } catch (error: any) {
    console.error('❌ Erro crítico na geração de copy:', error)
    
    // Tentar obter body para gerar fallback
    let fallbackResult: any = null
    try {
      const body = await request.json().catch(() => null)
      if (body) {
        fallbackResult = generateMockCopy(body as GenerateCopyRequest)
      }
    } catch {
      // Se não conseguir, usar fallback genérico
      fallbackResult = {
        copy_principal: "Erro ao gerar copy. Por favor, tente novamente.",
        variacoes: ["Tente novamente mais tarde"],
        headlines: ["Erro na geração"],
        descricao_curta: "Erro ao processar",
        legenda_anuncio: "Erro ao gerar copy",
      }
    }

    // SEMPRE retornar uma resposta, mesmo em caso de erro
    return NextResponse.json({
      success: true,
      data: fallbackResult || {
        copy_principal: "Erro ao gerar copy. Por favor, tente novamente.",
        variacoes: ["Tente novamente mais tarde"],
        headlines: ["Erro na geração"],
        descricao_curta: "Erro ao processar",
        legenda_anuncio: "Erro ao gerar copy",
      },
      id: null,
      warning: "Erro ao processar, mas uma copy foi retornada",
    })
  }
}

