import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getHotOffers } from "@/lib/db/offers-server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const offers = await getHotOffers(limit)

    return NextResponse.json({
      success: true,
      offers
    })
  } catch (error: any) {
    console.error('Error in /api/dashboard/hot-offers:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ofertas quentes" },
      { status: 500 }
    )
  }
}



