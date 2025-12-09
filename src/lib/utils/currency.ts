/**
 * Utilitários para formatação de moeda baseado no locale
 */

import { CountryLocale } from '@/lib/locale/country-mapping'

/**
 * Formata um valor em centavos para moeda formatada
 */
export function formatCurrency(cents: number, locale: CountryLocale, currency?: string): string {
  const value = cents / 100
  const currencyToUse = currency || locale.currency
  
  return new Intl.NumberFormat(locale.locale, {
    style: 'currency',
    currency: currencyToUse,
  }).format(value)
}

/**
 * Formata um valor decimal para moeda formatada
 */
export function formatCurrencyValue(value: number, locale: CountryLocale, currency?: string): string {
  const currencyToUse = currency || locale.currency
  
  return new Intl.NumberFormat(locale.locale, {
    style: 'currency',
    currency: currencyToUse,
  }).format(value)
}

/**
 * Converte centavos para valor decimal
 */
export function centsToDecimal(cents: number): number {
  return cents / 100
}

/**
 * Converte valor decimal para centavos
 */
export function decimalToCents(value: number): number {
  return Math.round(value * 100)
}



