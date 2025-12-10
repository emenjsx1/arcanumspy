import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar configurações do usuário
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

    const { data, error } = await supabase
      .from('pomodoro_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: "Erro ao buscar configurações", details: error.message },
        { status: 500 }
      )
    }

    // Se não existir, retornar valores padrão
    if (!data) {
      return NextResponse.json({
        success: true,
        settings: {
          focus_minutes: 25,
          short_break_minutes: 5,
          long_break_minutes: 15,
          pomodoros_until_long_break: 4,
        }
      })
    }

    const settingsData = data as { focus_minutes?: number; short_break_minutes?: number; long_break_minutes?: number; pomodoros_until_long_break?: number; [key: string]: any }
    return NextResponse.json({
      success: true,
      settings: {
        focus_minutes: settingsData.focus_minutes,
        short_break_minutes: settingsData.short_break_minutes,
        long_break_minutes: settingsData.long_break_minutes,
        pomodoros_until_long_break: settingsData.pomodoros_until_long_break,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// POST/PUT - Salvar configurações do usuário
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

    const body = await request.json()
    const { focus_minutes, short_break_minutes, long_break_minutes, pomodoros_until_long_break } = body

    // Verificar se já existe configuração
    const { data: existing } = await supabase
      .from('pomodoro_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let data, error

    if (existing) {
      // Atualizar
      const result = await (supabase
        .from('pomodoro_settings') as any)
        .update({
          focus_minutes: focus_minutes || 25,
          short_break_minutes: short_break_minutes || 5,
          long_break_minutes: long_break_minutes || 15,
          pomodoros_until_long_break: pomodoros_until_long_break || 4,
        })
        .eq('user_id', user.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Criar
      const result = await (supabase
        .from('pomodoro_settings') as any)
        .insert({
          user_id: user.id,
          focus_minutes: focus_minutes || 25,
          short_break_minutes: short_break_minutes || 5,
          long_break_minutes: long_break_minutes || 15,
          pomodoros_until_long_break: pomodoros_until_long_break || 4,
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      return NextResponse.json(
        { error: "Erro ao salvar configurações", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: {
        focus_minutes: data.focus_minutes,
        short_break_minutes: data.short_break_minutes,
        long_break_minutes: data.long_break_minutes,
        pomodoros_until_long_break: data.pomodoros_until_long_break,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}



