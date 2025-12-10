import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Buscar pomodoros do usuário
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') // 'focus', 'shortBreak', 'longBreak' ou null para todos
    const limit = parseInt(searchParams.get('limit') || '50')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('pomodoros')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (mode) {
      query = query.eq('mode', mode)
    }

    if (startDate) {
      query = query.gte('started_at', startDate)
    }

    if (endDate) {
      query = query.lte('started_at', endDate)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar pomodoros", details: error.message },
        { status: 500 }
      )
    }

    // Calcular estatísticas
    const stats = {
      total: data?.length || 0,
      completed: (data as any[])?.filter((p: any) => p.completed).length || 0,
      total_focus_time: (data as any[])?.filter((p: any) => p.mode === 'focus' && p.completed)
        .reduce((sum: number, p: any) => sum + p.completed_seconds, 0) || 0,
      today: (data as any[])?.filter((p: any) => {
        const today = new Date()
        const pomodoroDate = new Date(p.started_at)
        return today.toDateString() === pomodoroDate.toDateString()
      }).length || 0,
      this_week: (data as any[])?.filter((p: any) => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(p.started_at) >= weekAgo
      }).length || 0,
    }

    return NextResponse.json({
      success: true,
      pomodoros: data || [],
      stats
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// POST - Criar novo pomodoro
export async function POST(request: Request) {
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
    const { mode, duration_seconds, notes } = body

    if (!mode || !duration_seconds) {
      return NextResponse.json(
        { error: "Mode e duration_seconds são obrigatórios" },
        { status: 400 }
      )
    }

    if (!['focus', 'shortBreak', 'longBreak'].includes(mode)) {
      return NextResponse.json(
        { error: "Mode deve ser 'focus', 'shortBreak' ou 'longBreak'" },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase
      .from('pomodoros') as any)
      .insert({
        user_id: user.id,
        mode,
        duration_seconds,
        completed_seconds: 0,
        completed: false,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao criar pomodoro", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pomodoro: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar pomodoro (marcar como completo, atualizar tempo, etc)
export async function PATCH(request: Request) {
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
    const { id, completed, completed_seconds, notes } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (completed !== undefined) {
      updates.completed = completed
      if (completed) {
        updates.completed_at = new Date().toISOString()
      }
    }
    if (completed_seconds !== undefined) {
      updates.completed_seconds = completed_seconds
    }
    if (notes !== undefined) {
      updates.notes = notes
    }

    const { data, error } = await (supabase
      .from('pomodoros') as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar pomodoro", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pomodoro: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar pomodoro
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('pomodoros')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar pomodoro", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}



