/**
 * Mapeamento de países para idiomas e moedas
 * Baseado em códigos ISO de países
 */

export interface CountryLocale {
  countryCode: string
  countryName: string
  language: string // Código de idioma (ex: 'pt', 'en', 'es')
  locale: string // Locale completo (ex: 'pt-BR', 'en-US', 'pt-MZ')
  currency: string // Código da moeda (ex: 'USD', 'BRL', 'EUR', 'MZN')
  currencySymbol?: string // Símbolo da moeda (opcional)
}

/**
 * Mapeamento completo de países para idiomas e moedas
 */
export const COUNTRY_LOCALE_MAP: Record<string, CountryLocale> = {
  // Estados Unidos
  US: { countryCode: 'US', countryName: 'Estados Unidos', language: 'en', locale: 'en-US', currency: 'USD', currencySymbol: '$' },
  
  // Canadá
  CA: { countryCode: 'CA', countryName: 'Canadá', language: 'en', locale: 'en-CA', currency: 'CAD', currencySymbol: 'C$' },
  
  // México
  MX: { countryCode: 'MX', countryName: 'México', language: 'es', locale: 'es-MX', currency: 'MXN', currencySymbol: '$' },
  
  // Brasil
  BR: { countryCode: 'BR', countryName: 'Brasil', language: 'pt', locale: 'pt-BR', currency: 'BRL', currencySymbol: 'R$' },
  
  // Portugal
  PT: { countryCode: 'PT', countryName: 'Portugal', language: 'pt', locale: 'pt-PT', currency: 'EUR', currencySymbol: '€' },
  
  // Moçambique
  MZ: { countryCode: 'MZ', countryName: 'Moçambique', language: 'pt', locale: 'pt-MZ', currency: 'MZN', currencySymbol: 'MT' },
  
  // Angola
  AO: { countryCode: 'AO', countryName: 'Angola', language: 'pt', locale: 'pt-AO', currency: 'AOA', currencySymbol: 'Kz' },
  
  // Outros países lusófonos
  CV: { countryCode: 'CV', countryName: 'Cabo Verde', language: 'pt', locale: 'pt-CV', currency: 'CVE', currencySymbol: 'Esc' },
  GW: { countryCode: 'GW', countryName: 'Guiné-Bissau', language: 'pt', locale: 'pt-GW', currency: 'XOF', currencySymbol: 'CFA' },
  ST: { countryCode: 'ST', countryName: 'São Tomé e Príncipe', language: 'pt', locale: 'pt-ST', currency: 'STN', currencySymbol: 'Db' },
  TL: { countryCode: 'TL', countryName: 'Timor-Leste', language: 'pt', locale: 'pt-TL', currency: 'USD', currencySymbol: '$' },
  
  // União Europeia - Países principais
  ES: { countryCode: 'ES', countryName: 'Espanha', language: 'es', locale: 'es-ES', currency: 'EUR', currencySymbol: '€' },
  FR: { countryCode: 'FR', countryName: 'França', language: 'fr', locale: 'fr-FR', currency: 'EUR', currencySymbol: '€' },
  IT: { countryCode: 'IT', countryName: 'Itália', language: 'it', locale: 'it-IT', currency: 'EUR', currencySymbol: '€' },
  DE: { countryCode: 'DE', countryName: 'Alemanha', language: 'de', locale: 'de-DE', currency: 'EUR', currencySymbol: '€' },
  NL: { countryCode: 'NL', countryName: 'Países Baixos', language: 'nl', locale: 'nl-NL', currency: 'EUR', currencySymbol: '€' },
  BE: { countryCode: 'BE', countryName: 'Bélgica', language: 'nl', locale: 'nl-BE', currency: 'EUR', currencySymbol: '€' },
  AT: { countryCode: 'AT', countryName: 'Áustria', language: 'de', locale: 'de-AT', currency: 'EUR', currencySymbol: '€' },
  IE: { countryCode: 'IE', countryName: 'Irlanda', language: 'en', locale: 'en-IE', currency: 'EUR', currencySymbol: '€' },
  FI: { countryCode: 'FI', countryName: 'Finlândia', language: 'fi', locale: 'fi-FI', currency: 'EUR', currencySymbol: '€' },
  GR: { countryCode: 'GR', countryName: 'Grécia', language: 'el', locale: 'el-GR', currency: 'EUR', currencySymbol: '€' },
  PL: { countryCode: 'PL', countryName: 'Polônia', language: 'pl', locale: 'pl-PL', currency: 'PLN', currencySymbol: 'zł' },
  
  // Reino Unido
  GB: { countryCode: 'GB', countryName: 'Reino Unido', language: 'en', locale: 'en-GB', currency: 'GBP', currencySymbol: '£' },
  
  // Outros países importantes
  AR: { countryCode: 'AR', countryName: 'Argentina', language: 'es', locale: 'es-AR', currency: 'ARS', currencySymbol: '$' },
  CO: { countryCode: 'CO', countryName: 'Colômbia', language: 'es', locale: 'es-CO', currency: 'COP', currencySymbol: '$' },
  CL: { countryCode: 'CL', countryName: 'Chile', language: 'es', locale: 'es-CL', currency: 'CLP', currencySymbol: '$' },
  PE: { countryCode: 'PE', countryName: 'Peru', language: 'es', locale: 'es-PE', currency: 'PEN', currencySymbol: 'S/' },
  
  // Ásia
  CN: { countryCode: 'CN', countryName: 'China', language: 'zh', locale: 'zh-CN', currency: 'CNY', currencySymbol: '¥' },
  JP: { countryCode: 'JP', countryName: 'Japão', language: 'ja', locale: 'ja-JP', currency: 'JPY', currencySymbol: '¥' },
  KR: { countryCode: 'KR', countryName: 'Coreia do Sul', language: 'ko', locale: 'ko-KR', currency: 'KRW', currencySymbol: '₩' },
  IN: { countryCode: 'IN', countryName: 'Índia', language: 'hi', locale: 'hi-IN', currency: 'INR', currencySymbol: '₹' },
  
  // Oceania
  AU: { countryCode: 'AU', countryName: 'Austrália', language: 'en', locale: 'en-AU', currency: 'AUD', currencySymbol: 'A$' },
  NZ: { countryCode: 'NZ', countryName: 'Nova Zelândia', language: 'en', locale: 'en-NZ', currency: 'NZD', currencySymbol: 'NZ$' },
  
  // África
  ZA: { countryCode: 'ZA', countryName: 'África do Sul', language: 'en', locale: 'en-ZA', currency: 'ZAR', currencySymbol: 'R' },
  EG: { countryCode: 'EG', countryName: 'Egito', language: 'ar', locale: 'ar-EG', currency: 'EGP', currencySymbol: 'E£' },
  NG: { countryCode: 'NG', countryName: 'Nigéria', language: 'en', locale: 'en-NG', currency: 'NGN', currencySymbol: '₦' },
  KE: { countryCode: 'KE', countryName: 'Quênia', language: 'en', locale: 'en-KE', currency: 'KES', currencySymbol: 'KSh' },
  
  // Outros países europeus
  CH: { countryCode: 'CH', countryName: 'Suíça', language: 'de', locale: 'de-CH', currency: 'CHF', currencySymbol: 'CHF' },
  NO: { countryCode: 'NO', countryName: 'Noruega', language: 'no', locale: 'no-NO', currency: 'NOK', currencySymbol: 'kr' },
  SE: { countryCode: 'SE', countryName: 'Suécia', language: 'sv', locale: 'sv-SE', currency: 'SEK', currencySymbol: 'kr' },
  DK: { countryCode: 'DK', countryName: 'Dinamarca', language: 'da', locale: 'da-DK', currency: 'DKK', currencySymbol: 'kr' },
  RU: { countryCode: 'RU', countryName: 'Rússia', language: 'ru', locale: 'ru-RU', currency: 'RUB', currencySymbol: '₽' },
}

/**
 * Locale padrão (fallback)
 */
export const DEFAULT_LOCALE: CountryLocale = {
  countryCode: 'US',
  countryName: 'Estados Unidos',
  language: 'en',
  locale: 'en-US',
  currency: 'USD',
  currencySymbol: '$'
}

/**
 * Obtém informações de locale baseado no código do país
 */
export function getLocaleByCountryCode(countryCode: string): CountryLocale {
  const upperCode = countryCode.toUpperCase()
  return COUNTRY_LOCALE_MAP[upperCode] || DEFAULT_LOCALE
}

/**
 * Obtém locale baseado no nome do país
 */
export function getLocaleByCountryName(countryName: string): CountryLocale | null {
  const entry = Object.values(COUNTRY_LOCALE_MAP).find(
    locale => locale.countryName.toLowerCase() === countryName.toLowerCase()
  )
  return entry || null
}



