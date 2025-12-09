"use client"

import { useCurrency } from '@/contexts/locale-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DollarSign } from "lucide-react"
import { COUNTRY_CURRENCIES } from '@/lib/i18n/currency'

// Obter moedas únicas
const currencies = Array.from(
  new Map(
    Object.values(COUNTRY_CURRENCIES).map(c => [c.currency, c])
  ).values()
).sort((a, b) => a.currency.localeCompare(b.currency))

export function CurrencySelector() {
  const { currency, setCurrency, currencySymbol } = useCurrency()

  return (
    <div className="flex items-center gap-2">
      <DollarSign className="h-4 w-4" />
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Moeda" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((curr) => (
            <SelectItem key={curr.currency} value={curr.currency}>
              {curr.currencySymbol} {curr.currency} - {curr.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

