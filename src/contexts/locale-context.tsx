"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Locale, Translations } from '@/lib/i18n/translations'
import translations from '@/lib/i18n/translations'
import { detectLocationByIP, LocationData, clearLocationCache } from '@/lib/i18n/location'
import { getCurrencyByCountryCode, convertCentsToCurrency, formatCurrency, BASE_CURRENCY, BASE_LOCALE, COUNTRY_CURRENCIES } from '@/lib/i18n/currency'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  location: LocationData | null
  currency: string
  currencySymbol: string
  setCurrency: (currency: string) => void
  t: Translations
  formatPrice: (cents: number, originalCurrency?: string, forceCurrency?: string) => Promise<string>
  convertPrice: (cents: number, originalCurrency?: string) => Promise<number>
  loading: boolean
  refreshLocation: () => Promise<void>
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt-BR')
  const [location, setLocation] = useState<LocationData | null>(null)
  const [currency, setCurrency] = useState<string>(BASE_CURRENCY)
  const [currencySymbol, setCurrencySymbol] = useState<string>('MT')
  const [loading, setLoading] = useState(true)

  const loadLocaleSettings = useCallback(async () => {
    try {
      // CORREÇÃO CRÍTICA: Verificar novamente se estamos no cliente antes de acessar localStorage
      // Isso garante que nunca executa durante SSR/build
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }
      
      // OTIMIZAÇÃO: Carregar do localStorage primeiro (síncrono, não bloqueia)
      const savedLocale = localStorage.getItem('locale') as Locale | null
      const savedCurrency = localStorage.getItem('currency')
      const savedCountryCode = localStorage.getItem('countryCode')

      // Configurar valores do localStorage imediatamente (não bloqueia)
      if (savedLocale && Object.keys(translations).includes(savedLocale)) {
        setLocaleState(savedLocale)
      } else {
        setLocaleState('pt-BR') // Default imediato
      }

      if (savedCurrency) {
        setCurrency(savedCurrency)
        const currencyData = Object.values(COUNTRY_CURRENCIES).find(c => c.currency === savedCurrency)
        if (currencyData) {
          setCurrencySymbol(currencyData.currencySymbol)
        }
      } else {
        // Padrão: Metical de Moçambique
        setCurrency(BASE_CURRENCY)
        const mznData = Object.values(COUNTRY_CURRENCIES).find(c => c.currency === 'MZN')
        if (mznData) {
          setCurrencySymbol(mznData.currencySymbol)
        } else {
          setCurrencySymbol('MT')
        }
      }

      // Se já temos dados salvos, não precisamos fazer chamada de API
      if (savedLocale && savedCurrency && savedCountryCode) {
        // Criar location object do cache
        const currencyData = Object.values(COUNTRY_CURRENCIES).find(c => c.currency === savedCurrency)
        if (currencyData) {
          setLocation({
            country: currencyData.country || 'Unknown',
            countryCode: savedCountryCode,
            region: '',
            city: '',
            timezone: 'UTC',
            currency: savedCurrency,
            locale: savedLocale,
          })
        }
        setLoading(false)
        
        // Detectar localização em background (não bloqueia)
        detectLocationInBackground(savedLocale, savedCurrency)
        return
      }

      // Se não temos dados salvos, detectar localização (mas não bloquear)
      setLoading(false) // Liberar UI imediatamente
      
      // Detectar em background
      detectLocationInBackground(savedLocale, savedCurrency)
    } catch (error) {
      console.error('Erro ao carregar configurações de locale:', error)
      setLoading(false)
    }
  }, [])

  // Carregar localização e configurações salvas
  useEffect(() => {
    // CORREÇÃO CRÍTICA: Garantir que nunca executa durante SSR/build
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }
    loadLocaleSettings()
  }, [loadLocaleSettings])

  // Detectar localização em background (não bloqueia o carregamento)
  const detectLocationInBackground = async (savedLocale: Locale | null, savedCurrency: string | null) => {
    try {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') return
      
      const detectedLocation = await detectLocationByIP()
      setLocation(detectedLocation)

      // Se não há locale salvo, usar o detectado
      if (!savedLocale && typeof window !== 'undefined') {
        const detectedLocale = mapToSupportedLocale(detectedLocation.locale)
        setLocaleState(detectedLocale)
        localStorage.setItem('locale', detectedLocale)
      }

      // Configurar moeda se não estava salva
      if (!savedCurrency && typeof window !== 'undefined') {
        const countryCurrency = getCurrencyByCountryCode(detectedLocation.countryCode)
        setCurrency(countryCurrency.currency)
        setCurrencySymbol(countryCurrency.currencySymbol)
        localStorage.setItem('currency', countryCurrency.currency)
        localStorage.setItem('countryCode', detectedLocation.countryCode)
      }
    } catch (error) {
      console.error('Erro ao detectar localização (background):', error)
      // Não fazer nada, já temos valores padrão
    }
  }

  const mapToSupportedLocale = (detectedLocale: string): Locale => {
    // Mapear locale detectado para nossos locales suportados
    if (detectedLocale.startsWith('pt')) {
      if (detectedLocale.includes('BR')) return 'pt-BR'
      if (detectedLocale.includes('MZ')) return 'pt-MZ'
      return 'pt-BR' // Default para português
    }
    if (detectedLocale.startsWith('en')) return 'en-US'
    if (detectedLocale.startsWith('es')) return 'es-ES'
    if (detectedLocale.startsWith('fr')) return 'fr-FR'
    return 'en-US' // Default
  }

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
    }
    
    // Atualizar moeda baseada no locale se necessário
    const localeCurrencyMap: Record<Locale, string> = {
      'pt-BR': 'BRL',
      'pt-MZ': 'MZN',
      'en-US': 'USD',
      'es-ES': 'EUR',
      'fr-FR': 'EUR',
    }
    
    const newCurrency = localeCurrencyMap[newLocale] || currency
    if (newCurrency !== currency) {
      setCurrency(newCurrency)
      if (typeof window !== 'undefined') {
        localStorage.setItem('currency', newCurrency)
      }
    }
  }, [currency])

  const formatPrice = useCallback(async (cents: number, originalCurrency: string = BASE_CURRENCY, forceCurrency?: string): Promise<string> => {
    try {
      // Se forceCurrency for especificado, usar essa moeda
      // Caso contrário, usar a moeda selecionada pelo usuário (currency)
      const targetCurrency = forceCurrency || currency || BASE_CURRENCY
      const convertedAmount = await convertCentsToCurrency(cents, originalCurrency, targetCurrency)
      const targetLocale = targetCurrency === 'MZN' ? 'pt-MZ' : targetCurrency === 'BRL' ? 'pt-BR' : 'en-US'
      return formatCurrency(convertedAmount, targetCurrency, targetLocale)
    } catch (error) {
      console.error('Erro ao formatar preço:', error)
      // Fallback: formatar sem conversão usando a moeda selecionada
      const targetCurrency = currency || BASE_CURRENCY
      return formatCurrency(cents / 100, targetCurrency, locale)
    }
  }, [locale, currency])

  const convertPrice = useCallback(async (cents: number, originalCurrency: string = BASE_CURRENCY): Promise<number> => {
    try {
      return await convertCentsToCurrency(cents, originalCurrency, currency)
    } catch (error) {
      console.error('Erro ao converter preço:', error)
      // Fallback: retornar valor original
      return cents / 100
    }
  }, [currency])

  const refreshLocation = useCallback(async () => {
    clearLocationCache()
    // Limpar cache do localStorage também
    if (typeof window !== 'undefined') {
      localStorage.removeItem('locale')
      localStorage.removeItem('currency')
      localStorage.removeItem('countryCode')
    }
    await loadLocaleSettings()
  }, [loadLocaleSettings])

  const handleSetCurrency = useCallback((newCurrency: string) => {
    setCurrency(newCurrency)
    if (typeof window !== 'undefined') {
      localStorage.setItem('currency', newCurrency)
    }
    // Atualizar símbolo da moeda
    const currencyData = Object.values(COUNTRY_CURRENCIES).find(c => c.currency === newCurrency)
    if (currencyData) {
      setCurrencySymbol(currencyData.currencySymbol)
    }
  }, [])

  const value: LocaleContextType = {
    locale,
    setLocale,
    location,
    currency,
    currencySymbol,
    setCurrency: handleSetCurrency,
    t: translations[locale],
    formatPrice,
    convertPrice,
    loading,
    refreshLocation,
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

// Hook simplificado para traduções
export function useTranslation() {
  const { t } = useLocale()
  return t
}

// Hook simplificado para moeda
export function useCurrency() {
  const { currency, currencySymbol, setCurrency, formatPrice, convertPrice } = useLocale()
  return { currency, currencySymbol, setCurrency, formatPrice, convertPrice }
}
