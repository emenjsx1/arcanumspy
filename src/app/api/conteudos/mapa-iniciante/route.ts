import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Buscar conteúdo do mapa do iniciante
    const { data, error } = await supabase
      .from('conteudos')
      .select('*')
      .eq('tipo', 'mapa_iniciante')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar conteúdo", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conteudos: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

