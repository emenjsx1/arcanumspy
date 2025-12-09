// Mapeamento de países para moedas
export interface CountryCurrency {
  country: string
  countryCode: string
  currency: string
  currencySymbol: string
  locale: string
}

export const COUNTRY_CURRENCIES: Record<string, CountryCurrency> = {
  BR: { country: 'Brasil', countryCode: 'BR', currency: 'BRL', currencySymbol: 'R$', locale: 'pt-BR' },
  MZ: { country: 'Moçambique', countryCode: 'MZ', currency: 'MZN', currencySymbol: 'MT', locale: 'pt-MZ' },
  PT: { country: 'Portugal', countryCode: 'PT', currency: 'EUR', currencySymbol: '€', locale: 'pt-PT' },
  US: { country: 'Estados Unidos', countryCode: 'US', currency: 'USD', currencySymbol: '$', locale: 'en-US' },
  GB: { country: 'Reino Unido', countryCode: 'GB', currency: 'GBP', currencySymbol: '£', locale: 'en-GB' },
  ES: { country: 'Espanha', countryCode: 'ES', currency: 'EUR', currencySymbol: '€', locale: 'es-ES' },
  FR: { country: 'França', countryCode: 'FR', currency: 'EUR', currencySymbol: '€', locale: 'fr-FR' },
  DE: { country: 'Alemanha', countryCode: 'DE', currency: 'EUR', currencySymbol: '€', locale: 'de-DE' },
  IT: { country: 'Itália', countryCode: 'IT', currency: 'EUR', currencySymbol: '€', locale: 'it-IT' },
  MX: { country: 'México', countryCode: 'MX', currency: 'MXN', currencySymbol: '$', locale: 'es-MX' },
  AR: { country: 'Argentina', countryCode: 'AR', currency: 'ARS', currencySymbol: '$', locale: 'es-AR' },
  CO: { country: 'Colômbia', countryCode: 'CO', currency: 'COP', currencySymbol: '$', locale: 'es-CO' },
  CL: { country: 'Chile', countryCode: 'CL', currency: 'CLP', currencySymbol: '$', locale: 'es-CL' },
  ZA: { country: 'África do Sul', countryCode: 'ZA', currency: 'ZAR', currencySymbol: 'R', locale: 'en-ZA' },
  AO: { country: 'Angola', countryCode: 'AO', currency: 'AOA', currencySymbol: 'Kz', locale: 'pt-AO' },
  CA: { country: 'Canadá', countryCode: 'CA', currency: 'CAD', currencySymbol: '$', locale: 'en-CA' },
  AU: { country: 'Austrália', countryCode: 'AU', currency: 'AUD', currencySymbol: '$', locale: 'en-AU' },
  NZ: { country: 'Nova Zelândia', countryCode: 'NZ', currency: 'NZD', currencySymbol: '$', locale: 'en-NZ' },
  JP: { country: 'Japão', countryCode: 'JP', currency: 'JPY', currencySymbol: '¥', locale: 'ja-JP' },
  CN: { country: 'China', countryCode: 'CN', currency: 'CNY', currencySymbol: '¥', locale: 'zh-CN' },
  IN: { country: 'Índia', countryCode: 'IN', currency: 'INR', currencySymbol: '₹', locale: 'en-IN' },
}

// Moeda base (padrão) - Metical de Moçambique
export const BASE_CURRENCY = 'MZN'
export const BASE_LOCALE = 'pt-MZ'

// Taxas de câmbio aproximadas (serão atualizadas via API)
// Valores em relação ao USD (Dólar Americano)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1, // Base
  MZN: 64, // 1 USD ≈ 64 MZN (aproximado)
  BRL: 5.0, // 1 USD ≈ 5.0 BRL (aproximado)
  EUR: 0.92, // 1 USD ≈ 0.92 EUR
  GBP: 0.79, // 1 USD ≈ 0.79 GBP
  ZAR: 18.5, // 1 USD ≈ 18.5 ZAR
  AOA: 850, // 1 USD ≈ 850 AOA
}

// Função para obter moeda por código de país
export function getCurrencyByCountryCode(countryCode: string): CountryCurrency {
  const upperCode = countryCode.toUpperCase()
  return COUNTRY_CURRENCIES[upperCode] || {
    country: 'Unknown',
    countryCode: upperCode,
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
  }
}

// Função para formatar moeda
export function formatCurrency(
  amount: number,
  currency: string = BASE_CURRENCY,
  locale: string = BASE_LOCALE
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount)
  } catch (error) {
    // Fallback simples
    const symbol = COUNTRY_CURRENCIES[Object.keys(COUNTRY_CURRENCIES).find(
      key => COUNTRY_CURRENCIES[key].currency === currency
    ) || 'US']?.currencySymbol || '$'
    return `${symbol}${amount.toFixed(2)}`
  }
}

// Função para converter moeda
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount

  try {
    // Tentar buscar taxa de câmbio atualizada via API
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    )
    
    if (response.ok) {
      const data = await response.json()
      const rate = data.rates[toCurrency]
      if (rate) {
        return amount * rate
      }
    }
  } catch (error) {
    console.warn('Erro ao buscar taxa de câmbio, usando taxa local:', error)
  }

  // Fallback para taxas locais
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1
  const toRate = EXCHANGE_RATES[toCurrency] || 1
  
  // Converter via MZN como intermediário
  const amountInMZN = amount / fromRate
  return amountInMZN * toRate
}

// Função para converter centavos para valor e aplicar conversão
export async function convertCentsToCurrency(
  cents: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const amount = cents / 100
  return convertCurrency(amount, fromCurrency, toCurrency)
}



