import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withLongCache } from "@/lib/api-cache"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly_cents', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      const response = NextResponse.json(
        { error: "Erro ao buscar planos" },
        { status: 500 }
      )
      return response
    }

    const response = NextResponse.json({ plans: plans || [] })
    return withLongCache(response) // Cache de 5 minutos (dados estáticos)
  } catch (error: any) {
    console.error('Error in GET /api/plans:', error)
    const response = NextResponse.json(
      { error: error.message || "Erro ao buscar planos" },
      { status: 500 }
    )
    return response
  }
}














