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
        const pastaData = pasta as { id: string; [key: string]: any }
        const { count, error: countError } = await supabase
          .from('biblioteca_itens')
          .select('*', { count: 'exact', head: true })
          .eq('pasta_id', pastaData.id)

        return {
          ...pastaData,
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

    // Validar campos obrigatórios
    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { error: "Nome da pasta é obrigatório" },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase
      .from('biblioteca_pastas') as any)
      .insert({
        user_id: user.id,
        nome: nome.trim(),
        descricao: descricao?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar pasta:', error)
      
      // Verificar se é erro de constraint (nome duplicado, etc)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "Já existe uma pasta com este nome" },
          { status: 409 }
        )
      }
      
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
    console.error('❌ Erro ao processar requisição POST /api/espionagem/organizador-biblioteca:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

