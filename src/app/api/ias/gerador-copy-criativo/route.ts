import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Configuração da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = "gpt-4o-mini" // Modelo rápido e econômico
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

// Interface para os dados recebidos do front-end
interface GeradorCopyCriativoRequest {
  style: string // Estilo da copy (Agressivo, Neutro, Storytelling, etc.)
  creative_type: string // Tipo de criativo (Criativo curto, Script UGC, etc.)
  mechanism: string // Mecanismo do produto
  product_name: string // Nome do produto
  audience_age: number // Idade do público
  pain?: string // Dor do público
  promise?: string // Promessa
  benefits?: string // Benefícios
  story?: string // História resumida (opcional)
  description?: string // Informações extras (máximo 500 caracteres)
}

// Interface para a resposta estruturada
interface CopyResponse {
  headline: string
  subheadline: string
  body: string
  cta: string
}

/**
 * Monta o prompt para enviar à API da OpenAI
 * O prompt é construído com base nos dados fornecidos pelo usuário
 */
function buildPrompt(input: GeradorCopyCriativoRequest): string {
  // Descrições dos estilos de copy
  const styleDescriptions: Record<string, string> = {
    'Agressivo': 'Use um tom agressivo, direto e impactante. Foque em urgência e ação imediata.',
    'Neutro': 'Use um tom neutro, profissional e informativo. Mantenha objetividade.',
    'Storytelling': 'Conte uma história envolvente e emocional. Use narrativa para conectar com o público.',
    'Podcast': 'Use um tom conversacional e natural, como se estivesse falando em um podcast.',
    'Conversacional': 'Use linguagem coloquial e amigável, como uma conversa entre amigos.',
    'Estilo GC': 'Use o estilo de Grupo de Compra: urgência, escassez, comunidade e exclusividade.',
    'Estilo VSL': 'Use o estilo de Video Sales Letter: narrativa longa, storytelling e múltiplos gatilhos mentais.',
    'Estilo Direct Response': 'Use o estilo Direct Response: direto ao ponto, foco em conversão e CTA claro.',
  }

  // Descrições dos tipos de criativo
  const creativeTypeDescriptions: Record<string, string> = {
    'Criativo curto': 'Copy curta e objetiva, ideal para anúncios rápidos e impactantes. Máximo 2-3 parágrafos.',
    'Criativo longo': 'Copy longa e detalhada, com todos os elementos persuasivos. Desenvolva completamente a proposta.',
    'Script de UGC': 'Script para vídeo de usuário gerando conteúdo. Tom autêntico, conversacional e natural.',
    'Criativo no formato Podcast': 'Roteiro para formato podcast. Tom conversacional, com pausas e transições naturais.',
    'Roteiro para Reels': 'Roteiro otimizado para Reels do Instagram. Curto, dinâmico e com hook forte no início.',
    'Roteiro para TikTok': 'Roteiro otimizado para TikTok. Muito curto, direto e com hook impactante nos primeiros 3 segundos.',
    'Headline': 'Apenas uma headline poderosa e impactante. Deve capturar atenção imediatamente.',
    'Copy de imagem': 'Copy para acompanhar imagem. Complementa o visual, não repete o que a imagem já mostra.',
  }

  const styleDesc = styleDescriptions[input.style] || input.style
  const creativeTypeDesc = creativeTypeDescriptions[input.creative_type] || input.creative_type

  return `Você é um copywriter especialista em marketing digital e direct response marketing.

Crie uma copy completa seguindo estas especificações EXATAS:

ESTILO DA COPY: ${styleDesc}
TIPO DE CRIATIVO: ${creativeTypeDesc}
MECANISMO DO PRODUTO: ${input.mechanism}
NOME DO PRODUTO: ${input.product_name}
IDADE DO PÚBLICO: ${input.audience_age} anos
${input.pain ? `DOR DO PÚBLICO: ${input.pain}` : ''}
${input.promise ? `PROMESSA: ${input.promise}` : ''}
${input.benefits ? `BENEFÍCIOS: ${input.benefits}` : ''}
${input.story ? `HISTÓRIA RESUMIDA: ${input.story}` : ''}
${input.description ? `INFORMAÇÕES EXTRAS: ${input.description}` : ''}

REGRAS IMPORTANTES:
- Adapte o tom e linguagem à idade do público (${input.audience_age} anos)
- Siga RIGOROSAMENTE o estilo "${input.style}"
- Adapte o formato ao tipo de criativo "${input.creative_type}"
- Use o mecanismo "${input.mechanism}" como base
- NÃO invente informações que não foram fornecidas
- Seja específico e evite clichês genéricos
- Use gatilhos mentais apropriados ao estilo escolhido

IMPORTANTE: Você DEVE retornar APENAS um objeto JSON válido, sem markdown, sem explicações, sem texto adicional.

A estrutura JSON OBRIGATÓRIA é:
{
  "headline": "uma frase curta e impactante que captura atenção",
  "subheadline": "uma frase complementar que expande a headline",
  "body": "texto principal da copy, desenvolvido conforme o tipo de criativo escolhido",
  "cta": "call to action persuasivo e claro"
}

Retorne SOMENTE o JSON, sem markdown code blocks, sem texto explicativo, sem aspas extras.`
}

/**
 * Chama a API da OpenAI para gerar a copy
 */
async function generateWithOpenAI(prompt: string): Promise<CopyResponse> {
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
          content: 'Você é um copywriter especialista em marketing digital e direct response marketing. Sempre retorne apenas JSON válido, sem markdown, sem explicações.'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
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
    const parsed = JSON.parse(cleanContent)
    
    // Validar estrutura
    if (!parsed.headline || !parsed.subheadline || !parsed.body || !parsed.cta) {
      throw new Error('Resposta da API não contém todos os campos obrigatórios')
    }
    
    return parsed as CopyResponse
  } catch (e) {
    // Se falhar, tentar extrair JSON do texto
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.headline && parsed.subheadline && parsed.body && parsed.cta) {
        return parsed as CopyResponse
      }
    }
    throw new Error('Não foi possível parsear a resposta da IA em formato JSON válido')
  }
}

/**
 * Valida os dados recebidos do front-end
 */
function validateInput(input: any): { valid: boolean; error?: string } {
  // Campos obrigatórios
  if (!input.style || typeof input.style !== 'string' || input.style.trim() === '') {
    return { valid: false, error: 'Campo "style" é obrigatório' }
  }

  if (!input.creative_type || typeof input.creative_type !== 'string' || input.creative_type.trim() === '') {
    return { valid: false, error: 'Campo "creative_type" é obrigatório' }
  }

  if (!input.mechanism || typeof input.mechanism !== 'string' || input.mechanism.trim() === '') {
    return { valid: false, error: 'Campo "mechanism" é obrigatório' }
  }

  if (!input.product_name || typeof input.product_name !== 'string' || input.product_name.trim() === '') {
    return { valid: false, error: 'Campo "product_name" é obrigatório' }
  }

  if (!input.audience_age || typeof input.audience_age !== 'number' || input.audience_age < 1 || input.audience_age > 120) {
    return { valid: false, error: 'Campo "audience_age" deve ser um número entre 1 e 120' }
  }

  // Validar description (máximo 500 caracteres)
  if (input.description && typeof input.description === 'string' && input.description.length > 500) {
    return { valid: false, error: 'Campo "description" deve ter no máximo 500 caracteres' }
  }

  return { valid: true }
}

/**
 * Rota POST - Recebe dados do front-end e gera a copy
 */
export async function POST(request: NextRequest) {
  try {
    // Obter usuário autenticado
    const supabase = await createClient()
    
    // Try to get user from cookies first
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
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

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: "Não autenticado. Faça login para continuar." 
        },
        { status: 401 }
      )
    }

    // 2. Receber e validar dados do front-end
    const body: GeradorCopyCriativoRequest = await request.json()
    
    const validation = validateInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.error || "Dados inválidos" 
        },
        { status: 400 }
      )
    }

    // 3. Montar prompt
    const prompt = buildPrompt(body)

    // 4. Chamar API da OpenAI
    let copy: CopyResponse
    try {
      copy = await generateWithOpenAI(prompt)
    } catch (error: any) {
      console.error('Erro ao gerar copy com OpenAI:', error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Erro ao gerar copy. Tente novamente." 
        },
        { status: 500 }
      )
    }

    // 5. Retornar resposta estruturada
    return NextResponse.json({
      success: true,
      copy: copy
    })

  } catch (error: any) {
    console.error('Erro crítico na geração de copy:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Erro ao processar requisição" 
      },
      { status: 500 }
    )
  }
}
