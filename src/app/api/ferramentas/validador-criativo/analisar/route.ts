import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Configuração da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = "gpt-4o-mini" // Modelo rápido e econômico
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

interface CriativoData {
  nome: string
  gastou: string
  voltou: string
  cliques: string
  ic: string
  ctr: string
  cpm: string
  cpc: string
}

interface AnaliseResult {
  validado: boolean
  podeEscalar: boolean
  score: number
  analise: string
  pontosPositivos: string[]
  pontosAtencao: string[]
  recomendacoes: string[]
}

function calcularMetricas(criativo: CriativoData) {
  const gastou = parseFloat(criativo.gastou) || 0
  const voltou = parseFloat(criativo.voltou) || 0
  const cliques = parseFloat(criativo.cliques) || 0
  const ic = parseFloat(criativo.ic) || 0
  const ctr = parseFloat(criativo.ctr) || 0
  const cpm = parseFloat(criativo.cpm) || 0
  const cpc = parseFloat(criativo.cpc) || 0

  const roas = gastou > 0 ? (voltou / gastou) : 0
  const conversoes = cliques > 0 && ic > 0 ? (cliques * ic / 100) : 0
  const ticketMedio = conversoes > 0 ? (voltou / conversoes) : 0
  const cpa = conversoes > 0 ? (gastou / conversoes) : 0

  return {
    roas,
    conversoes,
    ticketMedio,
    cpa,
    gastou,
    voltou,
    cliques,
    ic,
    ctr,
    cpm,
    cpc
  }
}

function buildPrompt(criativo: CriativoData, metricas: ReturnType<typeof calcularMetricas>): string {
  return `Você é um especialista em análise de performance de criativos publicitários. Analise os seguintes dados de um criativo e determine se ele está validado e se pode ser escalado.

DADOS DO CRIATIVO:
- Nome: ${criativo.nome || "Não informado"}
- Investimento (Gastou): R$ ${metricas.gastou.toFixed(2)}
- Receita (Voltou): R$ ${metricas.voltou.toFixed(2)}
- Cliques: ${metricas.cliques}
- IC (Índice de Conversão): ${metricas.ic}%
- CTR (Click-Through Rate): ${metricas.ctr}%
- CPM (Custo por Mil): R$ ${metricas.cpm.toFixed(2)}
- CPC (Custo por Clique): R$ ${metricas.cpc.toFixed(2)}

MÉTRICAS CALCULADAS:
- ROAS (Return on Ad Spend): ${metricas.roas.toFixed(2)}x
- Conversões estimadas: ${metricas.conversoes.toFixed(2)}
- Ticket médio: R$ ${metricas.ticketMedio.toFixed(2)}
- CPA (Custo por Aquisição): R$ ${metricas.cpa.toFixed(2)}

CRITÉRIOS DE VALIDAÇÃO:
1. ROAS mínimo de 2.0x para considerar validado
2. IC mínimo de 2% para considerar bom
3. CTR mínimo de 1% para considerar bom
4. CPC competitivo (comparado com mercado)
5. Volume de dados suficiente (mínimo 100 cliques para análise confiável)

CRITÉRIOS PARA ESCALAR:
1. ROAS acima de 3.0x
2. IC acima de 3%
3. CTR acima de 1.5%
4. Volume de dados confiável (mínimo 500 cliques)
5. CPA abaixo de 30% do ticket médio
6. Tendência de crescimento ou estabilidade

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem explicações adicionais):
{
  "validado": true/false,
  "podeEscalar": true/false,
  "score": número de 0 a 100,
  "analise": "Análise detalhada em 2-3 parágrafos explicando a performance do criativo",
  "pontosPositivos": ["ponto 1", "ponto 2", "ponto 3"],
  "pontosAtencao": ["atenção 1", "atenção 2"],
  "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3"]
}

IMPORTANTE:
- Seja objetivo e baseado em dados
- O score deve refletir a qualidade geral do criativo (0-100)
- validado = true se o criativo atende aos critérios mínimos
- podeEscalar = true se o criativo tem potencial para aumentar o investimento
- Se faltarem dados importantes, indique isso nos pontos de atenção`
}

async function analisarComOpenAI(criativo: CriativoData, metricas: ReturnType<typeof calcularMetricas>): Promise<AnaliseResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada')
  }

  const prompt = buildPrompt(criativo, metricas)

  try {
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
            content: 'Você é um especialista em análise de performance de criativos publicitários. Sempre retorne apenas JSON válido, sem markdown, sem explicações.'
          },
          {
            role: 'user',
            content: prompt
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

    // Remover markdown code blocks se existirem (padrão do projeto)
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Tentar parsear o JSON
    let resultado: AnaliseResult
    try {
      resultado = JSON.parse(cleanContent)
    } catch (parseError) {
      // Se não conseguir parsear, tentar extrair JSON do texto
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resultado = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Não foi possível parsear a resposta da API')
      }
    }

    // Validar estrutura
    if (typeof resultado.validado !== 'boolean' || typeof resultado.podeEscalar !== 'boolean') {
      throw new Error('Resposta da API em formato inválido')
    }

    // Garantir arrays
    resultado.pontosPositivos = Array.isArray(resultado.pontosPositivos) ? resultado.pontosPositivos : []
    resultado.pontosAtencao = Array.isArray(resultado.pontosAtencao) ? resultado.pontosAtencao : []
    resultado.recomendacoes = Array.isArray(resultado.recomendacoes) ? resultado.recomendacoes : []
    resultado.score = typeof resultado.score === 'number' ? Math.max(0, Math.min(100, resultado.score)) : 50
    resultado.analise = typeof resultado.analise === 'string' ? resultado.analise : 'Análise não disponível'

    return resultado
  } catch (error: any) {
    console.error('Erro ao analisar com OpenAI:', error)
    throw error
  }
}

function analiseFallback(criativo: CriativoData, metricas: ReturnType<typeof calcularMetricas>): AnaliseResult {
  const roas = metricas.roas
  const validado = roas >= 2.0 && metricas.ic >= 2 && metricas.ctr >= 1
  const podeEscalar = roas >= 3.0 && metricas.ic >= 3 && metricas.ctr >= 1.5 && metricas.cliques >= 500

  let score = 50
  if (roas >= 4.0) score += 30
  else if (roas >= 3.0) score += 20
  else if (roas >= 2.0) score += 10
  else if (roas < 1.5) score -= 20

  if (metricas.ic >= 4) score += 10
  else if (metricas.ic >= 3) score += 5
  else if (metricas.ic < 2) score -= 10

  if (metricas.ctr >= 2) score += 10
  else if (metricas.ctr >= 1.5) score += 5
  else if (metricas.ctr < 1) score -= 10

  score = Math.max(0, Math.min(100, score))

  const pontosPositivos: string[] = []
  const pontosAtencao: string[] = []
  const recomendacoes: string[] = []

  if (roas >= 3.0) {
    pontosPositivos.push(`ROAS excelente de ${roas.toFixed(2)}x`)
  } else if (roas >= 2.0) {
    pontosPositivos.push(`ROAS positivo de ${roas.toFixed(2)}x`)
  } else {
    pontosAtencao.push(`ROAS abaixo do ideal: ${roas.toFixed(2)}x (mínimo recomendado: 2.0x)`)
    recomendacoes.push("Otimizar campanha para melhorar o retorno sobre investimento")
  }

  if (metricas.ic >= 3) {
    pontosPositivos.push(`Taxa de conversão alta: ${metricas.ic}%`)
  } else if (metricas.ic < 2) {
    pontosAtencao.push(`Taxa de conversão baixa: ${metricas.ic}% (mínimo recomendado: 2%)`)
    recomendacoes.push("Melhorar landing page e copy para aumentar conversões")
  }

  if (metricas.ctr >= 1.5) {
    pontosPositivos.push(`CTR competitivo: ${metricas.ctr}%`)
  } else if (metricas.ctr < 1) {
    pontosAtencao.push(`CTR abaixo do ideal: ${metricas.ctr}% (mínimo recomendado: 1%)`)
    recomendacoes.push("Testar novos criativos e headlines para melhorar CTR")
  }

  if (metricas.cliques < 100) {
    pontosAtencao.push("Volume de dados insuficiente para análise confiável")
    recomendacoes.push("Aguardar mais dados antes de tomar decisões importantes")
  }

  const analise = `O criativo "${criativo.nome || 'Sem nome'}" apresenta um ROAS de ${roas.toFixed(2)}x, com ${metricas.cliques} cliques e taxa de conversão de ${metricas.ic}%. ${validado ? 'O criativo está validado e pode ser considerado para uso contínuo.' : 'O criativo precisa de otimizações antes de ser considerado validado.'} ${podeEscalar ? 'Com base nos dados, há potencial para escalar o investimento neste criativo.' : 'Recomenda-se otimizar antes de considerar escalar o investimento.'}`

  return {
    validado,
    podeEscalar,
    score,
    analise,
    pontosPositivos,
    pontosAtencao,
    recomendacoes
  }
}

export async function POST(request: NextRequest) {
  try {
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
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { criativos } = body as { criativos: CriativoData[] }

    if (!criativos || !Array.isArray(criativos) || criativos.length === 0) {
      return NextResponse.json(
        { error: "Lista de criativos é obrigatória" },
        { status: 400 }
      )
    }

    const resultados: AnaliseResult[] = []

    for (const criativo of criativos) {
      const metricas = calcularMetricas(criativo)
      
      let resultado: AnaliseResult
      
      try {
        if (OPENAI_API_KEY) {
          resultado = await analisarComOpenAI(criativo, metricas)
        } else {
          resultado = analiseFallback(criativo, metricas)
        }
      } catch (error: any) {
        console.error('Erro ao analisar criativo, usando fallback:', error)
        resultado = analiseFallback(criativo, metricas)
      }

      resultados.push(resultado)
    }

    // Salvar histórico no banco (opcional)
    try {
      await (supabase
        .from('validacoes_criativo') as any)
        .insert({
          user_id: user.id,
          nome_arquivo: `Análise de ${criativos.length} criativo(s)`,
          valido: resultados.every(r => r.validado),
          problemas: resultados.flatMap(r => r.pontosAtencao),
          sugestoes: resultados.flatMap(r => r.recomendacoes)
        })
    } catch (error) {
      console.error('Erro ao salvar histórico:', error)
      // Não falhar a requisição se não conseguir salvar
    }

    return NextResponse.json({
      success: true,
      resultados
    })
  } catch (error: any) {
    console.error('Erro ao processar análise:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}


