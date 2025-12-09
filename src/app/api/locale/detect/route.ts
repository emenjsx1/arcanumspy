import { NextRequest, NextResponse } from "next/server"
import { detectLocaleFromIP } from "@/lib/locale/detection"

/**
 * GET /api/locale/detect
 * Detecta a localização do usuário via IP e retorna informações de locale (idioma + moeda)
 */
export async function GET(request: NextRequest) {
  try {
    const locale = await detectLocaleFromIP()
    
    return NextResponse.json({
      success: true,
      locale: {
        countryCode: locale.countryCode,
        countryName: locale.countryName,
        language: locale.language,
        locale: locale.locale,
        currency: locale.currency,
        currencySymbol: locale.currencySymbol,
      },
    })
  } catch (error: any) {
    console.error('Erro ao detectar locale:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao detectar localização",
      },
      { status: 500 }
    )
  }
}



