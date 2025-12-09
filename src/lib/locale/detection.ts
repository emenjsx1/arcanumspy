/**
 * Serviço de detecção de localização via IP
 */

import { getLocaleByCountryCode, DEFAULT_LOCALE, type CountryLocale } from './country-mapping'

export interface LocationData {
  countryCode: string
  countryName: string
  region?: string
  city?: string
  timezone?: string
}

/**
 * Detecta a localização do usuário usando o IP
 * Usa múltiplas APIs como fallback para garantir disponibilidade
 */
export async function detectLocationFromIP(): Promise<LocationData | null> {
  try {
    // Tentar primeiro com ipapi.co (gratuito, 1000 requisições/dia)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.country_code && data.country_name) {
          return {
            countryCode: data.country_code,
            countryName: data.country_name,
            region: data.region,
            city: data.city,
            timezone: data.timezone,
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao usar ipapi.co:', error)
    }

    // Fallback: usar ip-api.com (gratuito, 45 requisições/minuto)
    try {
      const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,timezone', {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success' && data.countryCode) {
          return {
            countryCode: data.countryCode,
            countryName: data.country,
            region: data.regionName,
            city: data.city,
            timezone: data.timezone,
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao usar ip-api.com:', error)
    }

    // Fallback: usar geojs.io (gratuito, sem limite conhecido)
    try {
      const response = await fetch('https://get.geojs.io/v1/ip/geo.json', {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.country_code && data.country) {
          return {
            countryCode: data.country_code,
            countryName: data.country,
            region: data.region,
            city: data.city,
            timezone: data.timezone,
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao usar geojs.io:', error)
    }

    return null
  } catch (error) {
    console.error('Erro ao detectar localização:', error)
    return null
  }
}

/**
 * Obtém informações completas de locale (idioma + moeda) baseado no IP
 */
export async function detectLocaleFromIP(): Promise<CountryLocale> {
  const location = await detectLocationFromIP()
  
  if (location) {
    const locale = getLocaleByCountryCode(location.countryCode)
    return {
      country: location.countryName,
      countryCode: location.countryCode,
      locale: locale.locale,
      currency: locale.currency,
    }
    return locale
  }

  console.warn('⚠️ Não foi possível detectar localização, usando padrão:', DEFAULT_LOCALE)
  return DEFAULT_LOCALE
}



