import { NextResponse } from 'next/server'

// Detecção de localização por IP (executado no servidor para evitar CORS)
export async function GET() {
  try {
    // Tentar múltiplas APIs de geolocalização
    const apis = [
      // API 1: ipapi.co (gratuita, 1000 req/dia)
      async () => {
        const response = await fetch('https://ipapi.co/json/', {
          headers: {
            'Accept': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          return {
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || 'US',
            region: data.region || '',
            city: data.city || '',
            timezone: data.timezone || 'UTC',
            currency: data.currency || 'USD',
            locale: getLocaleFromCountry(data.country_code || 'US'),
          }
        }
        throw new Error('ipapi.co failed')
      },
      // API 2: ip-api.com (gratuita, 45 req/min)
      async () => {
        const response = await fetch('http://ip-api.com/json/', {
          headers: {
            'Accept': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          return {
            country: data.country || 'Unknown',
            countryCode: data.countryCode || 'US',
            region: data.regionName || '',
            city: data.city || '',
            timezone: data.timezone || 'UTC',
            currency: getCurrencyFromCountry(data.countryCode || 'US'),
            locale: getLocaleFromCountry(data.countryCode || 'US'),
          }
        }
        throw new Error('ip-api.com failed')
      },
      // API 3: geojs.io (gratuita, sem limite conhecido)
      async () => {
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json', {
          headers: {
            'Accept': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          return {
            country: data.country || 'Unknown',
            countryCode: data.country_code || 'US',
            region: data.region || '',
            city: data.city || '',
            timezone: data.timezone || 'UTC',
            currency: getCurrencyFromCountry(data.country_code || 'US'),
            locale: getLocaleFromCountry(data.country_code || 'US'),
          }
        }
        throw new Error('geojs.io failed')
      },
    ]

    // Tentar cada API em sequência
    for (const api of apis) {
      try {
        const result = await api()
        return NextResponse.json(result)
      } catch (error) {
        console.warn('Erro ao usar API de geolocalização:', error)
        continue
      }
    }

    // Se todas falharem, retornar valores padrão
    return NextResponse.json({
      country: 'Unknown',
      countryCode: 'US',
      region: '',
      city: '',
      timezone: 'UTC',
      currency: 'USD',
      locale: 'en-US',
    })
  } catch (error: any) {
    console.error('Erro ao detectar localização:', error)
    // Retornar valores padrão em caso de erro
    return NextResponse.json({
      country: 'Unknown',
      countryCode: 'US',
      region: '',
      city: '',
      timezone: 'UTC',
      currency: 'USD',
      locale: 'en-US',
    })
  }
}

// Função auxiliar para obter locale baseado no país
function getLocaleFromCountry(countryCode: string): string {
  const localeMap: Record<string, string> = {
    BR: 'pt-BR',
    MZ: 'pt-MZ',
    PT: 'pt-PT',
    US: 'en-US',
    GB: 'en-GB',
    ES: 'es-ES',
    FR: 'fr-FR',
    DE: 'de-DE',
    IT: 'it-IT',
    MX: 'es-MX',
    AR: 'es-AR',
    CO: 'es-CO',
    CL: 'es-CL',
    ZA: 'en-ZA',
    AO: 'pt-AO',
    CA: 'en-CA',
    AU: 'en-AU',
    NZ: 'en-NZ',
    JP: 'ja-JP',
    CN: 'zh-CN',
    IN: 'en-IN',
  }
  return localeMap[countryCode.toUpperCase()] || 'en-US'
}

// Função auxiliar para obter moeda baseado no país
function getCurrencyFromCountry(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    BR: 'BRL',
    MZ: 'MZN',
    PT: 'EUR',
    US: 'USD',
    GB: 'GBP',
    ES: 'EUR',
    FR: 'EUR',
    DE: 'EUR',
    IT: 'EUR',
    MX: 'MXN',
    AR: 'ARS',
    CO: 'COP',
    CL: 'CLP',
    ZA: 'ZAR',
    AO: 'AOA',
    CA: 'CAD',
    AU: 'AUD',
    NZ: 'NZD',
    JP: 'JPY',
    CN: 'CNY',
    IN: 'INR',
  }
  return currencyMap[countryCode.toUpperCase()] || 'USD'
}



