import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { produto_principal, produto_upsell } = await request.json()

    if (!produto_principal || !produto_principal.trim()) {
      return NextResponse.json(
        { error: "Descrição do produto principal é obrigatória" },
        { status: 400 }
      )
    }

    if (!produto_upsell || !produto_upsell.trim()) {
      return NextResponse.json(
        { error: "Descrição do produto de upsell é obrigatória" },
        { status: 400 }
      )
    }

    // Preparar prompt para gerar texto de upsell
    const prompt = `Crie um texto de upsell persuasivo que ofereça o seguinte produto complementar:
    
Produto Principal: ${produto_principal}
Produto de Upsell: ${produto_upsell}

O texto deve:
- Destacar como o produto de upsell complementa o produto principal
- Criar valor e urgência
- Oferecer um desconto ou benefício especial
- Ter uma chamada para ação clara e convincente
- Ser natural e não parecer forçado`

    // Usar OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY
    let upsell = null

    if (openaiApiKey) {
      try {
        const systemInstruction = 'Você é um especialista em vendas e marketing, especializado em criar ofertas de upsell eficazes. Crie textos persuasivos que aumentem as vendas.'
        const fullPrompt = `${systemInstruction}\n\n${prompt}`
        
        const openaiResponse = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: systemInstruction
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 800,
            })
          }
        )

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          upsell = openaiData.choices?.[0]?.message?.content || null
        } else {
          const errorText = await openaiResponse.text()
          console.error('Erro ao gerar upsell com OpenAI:', errorText)
        }
      } catch (error) {
        console.error('Erro ao chamar OpenAI:', error)
      }
    }

    // Se não tiver resposta da API, retornar upsell de exemplo
    if (!upsell) {
      upsell = `Oferta Especial de Upsell

Você já está adquirindo: ${produto_principal}

Que tal potencializar ainda mais seus resultados com: ${produto_upsell}

Esta é uma oportunidade única de complementar sua compra com um produto que vai maximizar seus resultados.

[Benefícios do upsell]
[Desconto ou oferta especial]
[Chamada para ação]`
    }

    // Salvar no banco se a tabela existir
    try {
      const { data, error } = await supabase
        .from('upsells_gerados')
        .insert({
          user_id: user.id,
          produto_principal,
          produto_upsell,
          texto: upsell,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar upsell:', error)
      }
    } catch (error) {
      // Tabela pode não existir, continuar
    }

    return NextResponse.json({
      success: true,
      upsell
    })
  } catch (error: any) {
    console.error('Error in upsell generation:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar upsell" },
      { status: 500 }
    )
  }
}
