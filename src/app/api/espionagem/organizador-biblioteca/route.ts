import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from '@/lib/auth/isAuthenticated'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login para continuar." },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Buscar pastas do usuário com contagem de itens
    const { data: pastas, error: pastasError } = await supabase
      .from('biblioteca_pastas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (pastasError) {
      console.error('Erro ao buscar pastas:', pastasError)
      return NextResponse.json(
        { error: "Erro ao buscar pastas", details: pastasError.message },
        { status: 500 }
      )
    }

    // Buscar contagem de itens para cada pasta
    const pastasComContagem = await Promise.all(
      (pastas || []).map(async (pasta) => {
        const { count, error: countError } = await supabase
          .from('biblioteca_itens')
          .select('*', { count: 'exact', head: true })
          .eq('pasta_id', pasta.id)

        return {
          ...pasta,
          itens: [{ count: countError ? 0 : (count || 0) }]
        }
      })
    )

    return NextResponse.json({
      success: true,
      pastas: pastasComContagem
    })
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    const body = await request.json()
    const { nome, descricao } = body

    const { data, error } = await supabase
      .from('biblioteca_pastas')
      .insert({
        user_id: user.id,
        nome,
        descricao
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao criar pasta", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pasta: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

