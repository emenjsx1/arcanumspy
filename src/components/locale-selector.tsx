"use client"

import { useLocale } from '@/contexts/locale-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe } from "lucide-react"

const locales = [
  { value: 'pt-BR', label: '🇧🇷 Português (BR)' },
  { value: 'pt-MZ', label: '🇲🇿 Português (MZ)' },
  { value: 'en-US', label: '🇺🇸 English (US)' },
  { value: 'es-ES', label: '🇪🇸 Español' },
  { value: 'fr-FR', label: '🇫🇷 Français' },
] as const

export function LocaleSelector() {
  const { locale, setLocale, loading } = useLocale()

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        <span className="text-sm">...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4" />
      <Select value={locale} onValueChange={(value) => setLocale(value as any)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Idioma" />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc.value} value={loc.value}>
              {loc.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
