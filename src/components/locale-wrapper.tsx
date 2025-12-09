"use client"

import { useEffect } from 'react'
import { useLocale } from '@/contexts/locale-context'

// Wrapper para atualizar o atributo lang do HTML baseado no locale
export function LocaleWrapper({ children }: { children: React.ReactNode }) {
  // CORREÇÃO: Hooks devem ser chamados sempre, não dentro de try/catch
  const { locale, loading } = useLocale()

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      try {
        // Atualizar o atributo lang do HTML
        document.documentElement.lang = locale
      } catch (error) {
        console.error('Erro ao atualizar lang:', error)
      }
    }
  }, [locale, loading])

  return <>{children}</>
}
