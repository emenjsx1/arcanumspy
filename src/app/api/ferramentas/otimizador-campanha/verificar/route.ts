import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Configuração da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = "gpt-4o-mini" // Modelo rápido e econômico
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

interface Upsell {
  ticket: string
  conversao: string
}

interface PerformanceData {
  vendas: string
  valorGasto: string
  quantoVoltou: string
  roi: string
}

interface OtimizacaoResult {
  analise: string
  recomendacoes: string[]
  metricasOtimizadas: {
    roasProjetado: number
    receitaProjetada: number
    lucroProjetado: number
  }
  pontosMelhoria: string[]
}

function calcularMetricas(
  ticketProdutoPrincipal: number,
  upsells: Upsell[],
  performance: PerformanceData
) {
  const vendas = parseFloat(performance.vendas) || 0
  const valorGasto = parseFloat(performance.valorGasto) || 0
  const quantoVoltou = parseFloat(performance.quantoVoltou) || 0
  const roi = parseFloat(performance.roi) || 0

  // Receita do produto principal
  const receitaPrincipal = vendas * ticketProdutoPrincipal

  // Receita dos upsells
  let receitaUpsells = 0
  upsells.forEach(upsell => {
    const ticket = parseFloat(upsell.ticket) || 0
    const conversao = parseFloat(upsell.conversao) || 0
    receitaUpsells += vendas * (conversao / 100) * ticket
  })

  // Receita total
  const receitaTotal = receitaPrincipal + receitaUpsells

  // ROAS atual
  const roasAtual = valorGasto > 0 ? (quantoVoltou / valorGasto) : 0

  // Lucro atual
  const lucroAtual = quantoVoltou - valorGasto

  // CPA atual
  const cpaAtual = vendas > 0 ? (valorGasto / vendas) : 0

  // Ticket médio atual
  const ticketMedioAtual = vendas > 0 ? (quantoVoltou / vendas) : 0

  // Projeções otimizadas
  const melhoriasPossiveis = {
    aumentoConversao: 0.15, // 15% de melhoria na conversão
    reducaoCPA: 0.10, // 10% de redução no CPA
    aumentoTicketMedio: 0.20 // 20% de aumento no ticket médio
  }

  const vendasOtimizadas = vendas * (1 + melhoriasPossiveis.aumentoConversao)
  const cpaOtimizado = cpaAtual * (1 - melhoriasPossiveis.reducaoCPA)
  const investimentoOtimizado = vendasOtimizadas * cpaOtimizado
  const ticketMedioOtimizado = ticketMedioAtual * (1 + melhoriasPossiveis.aumentoTicketMedio)
  const receitaOtimizada = vendasOtimizadas * ticketMedioOtimizado
  const lucroOtimizado = receitaOtimizada - investimentoOtimizado
  const roasOtimizado = investimentoOtimizado > 0 ? (receitaOtimizada / investimentoOtimizado) : 0

  return {
    receitaPrincipal,
    receitaUpsells,
    receitaTotal,
    roasAtual,
    lucroAtual,
    cpaAtual,
    ticketMedioAtual,
    vendas,
    valorGasto,
    quantoVoltou,
    roasOtimizado,
    receitaOtimizada,
    lucroOtimizado,
    investimentoOtimizado,
    vendasOtimizadas
  }
}

function buildPrompt(
  ticketProdutoPrincipal: number,
  upsells: Upsell[],
  performance: PerformanceData,
  metricas: ReturnType<typeof calcularMetricas>
): string {
  const upsellsInfo = upsells.map((upsell, index) => 
    `Upsell ${index + 1}: Ticket R$ ${parseFloat(upsell.ticket) || 0}, Conversão ${parseFloat(upsell.conversao) || 0}%`
  ).join('\n')

  return `Você é um especialista em otimização de campanhas de marketing digital e funis de vendas. Analise os seguintes dados de uma campanha e forneça recomendações de otimização.

CONFIGURAÇÃO DO FUNIL:
- Ticket do Produto Principal: R$ ${ticketProdutoPrincipal}
${upsells.length > 0 ? `- Upsells:\n${upsellsInfo}` : '- Sem upsells configurados'}

DADOS DE PERFORMANCE:
- Vendas do Produto Principal: ${metricas.vendas}
- Valor Gasto: R$ ${metricas.valorGasto.toFixed(2)}
- Quanto Voltou: R$ ${metricas.quantoVoltou.toFixed(2)}
- ROI: ${performance.roi || 'Não informado'}%

MÉTRICAS CALCULADAS:
- ROAS Atual: ${metricas.roasAtual.toFixed(2)}x
- Lucro Atual: R$ ${metricas.lucroAtual.toFixed(2)}
- CPA Atual: R$ ${metricas.cpaAtual.toFixed(2)}
- Ticket Médio Atual: R$ ${metricas.ticketMedioAtual.toFixed(2)}
- Receita do Produto Principal: R$ ${metricas.receitaPrincipal.toFixed(2)}
- Receita dos Upsells: R$ ${metricas.receitaUpsells.toFixed(2)}
- Receita Total: R$ ${metricas.receitaTotal.toFixed(2)}

PROJEÇÕES OTIMIZADAS:
- ROAS Projetado: ${metricas.roasOtimizado.toFixed(2)}x
- Receita Projetada: R$ ${metricas.receitaOtimizada.toFixed(2)}
- Lucro Projetado: R$ ${metricas.lucroOtimizado.toFixed(2)}
- Vendas Projetadas: ${metricas.vendasOtimizadas.toFixed(0)}
- Investimento Projetado: R$ ${metricas.investimentoOtimizado.toFixed(2)}

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem explicações adicionais):
{
  "analise": "Análise detalhada em 2-3 parágrafos sobre a performance atual da campanha, pontos fortes e fracos",
  "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3", "recomendação 4"],
  "metricasOtimizadas": {
    "roasProjetado": ${metricas.roasOtimizado},
    "receitaProjetada": ${metricas.receitaOtimizada},
    "lucroProjetado": ${metricas.lucroOtimizado}
  },
  "pontosMelhoria": ["ponto 1", "ponto 2", "ponto 3"]
}

IMPORTANTE:
- Seja objetivo e baseado em dados
- Foque em recomendações práticas e acionáveis
- Considere o funil completo (produto principal + upsells)
- Identifique oportunidades de otimização específicas
- Se faltarem dados importantes, indique isso nos pontos de melhoria`
}

async function analisarComOpenAI(
  ticketProdutoPrincipal: number,
  upsells: Upsell[],
  performance: PerformanceData,
  metricas: ReturnType<typeof calcularMetricas>
): Promise<OtimizacaoResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada')
  }

  const prompt = buildPrompt(ticketProdutoPrincipal, upsells, performance, metricas)

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
            content: 'Você é um especialista em otimização de campanhas de marketing digital e funis de vendas. Sempre retorne apenas JSON válido, sem markdown, sem explicações.'
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
    let resultado: OtimizacaoResult
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

    // Validar e garantir estrutura
    resultado.analise = typeof resultado.analise === 'string' ? resultado.analise : 'Análise não disponível'
    resultado.recomendacoes = Array.isArray(resultado.recomendacoes) ? resultado.recomendacoes : []
    resultado.pontosMelhoria = Array.isArray(resultado.pontosMelhoria) ? resultado.pontosMelhoria : []
    
    if (!resultado.metricasOtimizadas) {
      resultado.metricasOtimizadas = {
        roasProjetado: metricas.roasOtimizado,
        receitaProjetada: metricas.receitaOtimizada,
        lucroProjetado: metricas.lucroOtimizado
      }
    }

    return resultado
  } catch (error: any) {
    console.error('Erro ao analisar com OpenAI:', error)
    throw error
  }
}

function analiseFallback(
  ticketProdutoPrincipal: number,
  upsells: Upsell[],
  performance: PerformanceData,
  metricas: ReturnType<typeof calcularMetricas>
): OtimizacaoResult {
  const analise = `A campanha apresenta um ROAS de ${metricas.roasAtual.toFixed(2)}x, com ${metricas.vendas} vendas e receita total de R$ ${metricas.receitaTotal.toFixed(2)}. ${metricas.roasAtual >= 3.0 ? 'A performance está excelente e há potencial para escalar.' : metricas.roasAtual >= 2.0 ? 'A performance está boa, mas há espaço para otimizações.' : 'A campanha precisa de otimizações urgentes para melhorar a rentabilidade.'}`

  const recomendacoes: string[] = []
  const pontosMelhoria: string[] = []

  if (metricas.roasAtual < 2.0) {
    pontosMelhoria.push("ROAS abaixo do ideal - necessário otimizar campanha")
    recomendacoes.push("Reduzir CPA através de otimização de público e criativos")
    recomendacoes.push("Melhorar taxa de conversão da landing page")
  }

  if (metricas.receitaUpsells < metricas.receitaPrincipal * 0.3) {
    pontosMelhoria.push("Receita de upsells abaixo do potencial")
    recomendacoes.push("Otimizar sequência de upsells e aumentar taxa de conversão")
  }

  if (metricas.cpaAtual > ticketProdutoPrincipal * 0.3) {
    pontosMelhoria.push("CPA muito alto em relação ao ticket")
    recomendacoes.push("Refinar segmentação de público para reduzir custos")
  }

  if (upsells.length === 0) {
    recomendacoes.push("Adicionar upsells ao funil para aumentar ticket médio")
  }

  recomendacoes.push("Testar novos criativos para melhorar CTR e conversão")
  recomendacoes.push("Implementar remarketing para recuperar visitantes não convertidos")

  return {
    analise,
    recomendacoes,
    metricasOtimizadas: {
      roasProjetado: metricas.roasOtimizado,
      receitaProjetada: metricas.receitaOtimizada,
      lucroProjetado: metricas.lucroOtimizado
    },
    pontosMelhoria
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
    const { ticketProdutoPrincipal, upsells, performance } = body

    if (!ticketProdutoPrincipal || !performance) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    const ticketPrincipal = parseFloat(ticketProdutoPrincipal) || 0
    const upsellsArray = Array.isArray(upsells) ? upsells : []
    const performanceData: PerformanceData = performance || {}

    const metricas = calcularMetricas(ticketPrincipal, upsellsArray, performanceData)

    let resultado: OtimizacaoResult

    try {
      if (OPENAI_API_KEY) {
        resultado = await analisarComOpenAI(ticketPrincipal, upsellsArray, performanceData, metricas)
      } else {
        resultado = analiseFallback(ticketPrincipal, upsellsArray, performanceData, metricas)
      }
    } catch (error: any) {
      console.error('Erro ao analisar campanha, usando fallback:', error)
      resultado = analiseFallback(ticketPrincipal, upsellsArray, performanceData, metricas)
    }

    // Salvar histórico no banco (opcional)
    try {
      await (supabase
        .from('otimizacoes_campanha') as any)
        .insert({
          user_id: user.id,
          url_campanha: `Análise de campanha - ${new Date().toISOString()}`,
          sugestoes: resultado.recomendacoes,
          score_atual: metricas.roasAtual * 10, // Converter ROAS para score 0-100
          score_otimizado: metricas.roasOtimizado * 10
        })
    } catch (error) {
      console.error('Erro ao salvar histórico:', error)
      // Não falhar a requisição se não conseguir salvar
    }

    return NextResponse.json({
      success: true,
      resultado
    })
  } catch (error: any) {
    console.error('Erro ao processar verificação:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

