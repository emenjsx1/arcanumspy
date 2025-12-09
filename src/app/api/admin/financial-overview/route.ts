import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminGetFinancialOverview } from "@/lib/db/payments"

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const overview = await adminGetFinancialOverview()

    return NextResponse.json({ overview })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar overview financeiro" },
      { status: 500 }
    )
  }
}

