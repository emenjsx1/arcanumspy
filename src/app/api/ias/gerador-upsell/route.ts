import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
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

    // Usar Gemini AI
    const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBEkN2vCd-ReoxfDO-859dDsxOvDluhPno'
    let upsell = null

    if (geminiApiKey) {
      try {
        const systemInstruction = 'Você é um especialista em vendas e marketing, especializado em criar ofertas de upsell eficazes. Crie textos persuasivos que aumentem as vendas.'
        const fullPrompt = `${systemInstruction}\n\n${prompt}`
        
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: fullPrompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
              }
            })
          }
        )

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          upsell = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || null
        } else {
          const errorText = await geminiResponse.text()
          console.error('Erro ao gerar upsell com Gemini:', errorText)
        }
      } catch (error) {
        console.error('Erro ao chamar Gemini:', error)
      }
    }

    // Se não tiver OpenAI, retornar upsell de exemplo
    if (!upsell) {
      upsell = `Oferta Especial de Upsell

Você já está adquirindo: ${produto_principal}

Que tal potencializar ainda mais seus resultados com: ${produto_upsell}

Esta é uma oportunidade única de complementar sua compra com um produto que vai maximizar seus resultados.

[Benefícios do upsell]
[Desconto ou oferta especial]
[Chamada para ação]`
    }

    // Salvar no banco se a tabela existir (comentado pois a tabela pode não existir)
    // try {
    //   const { data, error } = await supabase
    //     .from('upsells_gerados')
    //     .insert({
    //       user_id: user.id,
    //       produto_principal,
    //       produto_upsell,
    //       texto: upsell,
    //     })
    //     .select()
    //     .single()

    //   if (error) {
    //     console.error('Erro ao salvar upsell:', error)
    //   }
    // } catch (error) {
    //   console.warn('Erro ao salvar upsell no banco (não crítico):', error)
    // }

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
