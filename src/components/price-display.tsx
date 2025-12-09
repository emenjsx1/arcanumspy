"use client"

import { useState, useEffect } from 'react'
import { useCurrency } from '@/contexts/locale-context'

interface PriceDisplayProps {
  cents: number
  originalCurrency?: string
  className?: string
  forceCurrency?: string // Para forçar uma moeda específica (ex: 'MZN' no checkout)
}

export function PriceDisplay({ cents, originalCurrency, className, forceCurrency }: PriceDisplayProps) {
  const { formatPrice } = useCurrency()
  const [formattedPrice, setFormattedPrice] = useState<string>('...')

  useEffect(() => {
    formatPrice(cents, originalCurrency, forceCurrency).then(setFormattedPrice).catch(() => {
      // Fallback
      const value = cents / 100
      const currency = forceCurrency || originalCurrency || 'USD'
      setFormattedPrice(new Intl.NumberFormat(currency === 'MZN' ? 'pt-MZ' : 'en-US', {
        style: 'currency',
        currency: currency
      }).format(value))
    })
  }, [cents, originalCurrency, forceCurrency, formatPrice])

  return <span className={className}>{formattedPrice}</span>
}

