"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface CreditBalance {
  balance: number
  total_loaded: number
  total_consumed: number
  is_blocked: boolean
  low_balance_threshold: number
}

export function CreditAlert() {
  const router = useRouter()
  const { toast } = useToast()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBalance()
    // Verificar saldo a cada 30 segundos
    const interval = setInterval(loadBalance, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/credits', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.balance) {
          setBalance(data.balance)
          
          // Mostrar toast se saldo negativo
          if (data.balance.balance < 0 && !dismissed) {
            toast({
              title: "Saldo Negativo",
              description: `Seu saldo está negativo: ${data.balance.balance} créditos. Carregue créditos para continuar usando a plataforma.`,
              variant: "destructive",
              duration: 10000,
            })
          } else if (
            data.balance.balance <= data.balance.low_balance_threshold &&
            data.balance.balance >= 0 &&
            !dismissed
          ) {
            toast({
              title: "Saldo Baixo",
              description: `Seu saldo está baixo: ${data.balance.balance} créditos. Considere carregar mais créditos.`,
              duration: 8000,
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading credit balance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !balance || dismissed) {
    return null
  }

  // Mostrar alerta apenas se saldo negativo ou muito baixo
  if (balance.balance < 0) {
    return (
      <Alert variant="destructive" className="mb-4 border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Saldo Negativo</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Seu saldo está negativo: <strong>{balance.balance} créditos</strong>.
            {balance.is_blocked && " Sua conta foi bloqueada por dívida."}
            {" "}Carregue créditos para continuar usando a plataforma.
          </span>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              onClick={() => router.push('/credits')}
              className="shrink-0"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Carregar Créditos
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (balance.balance <= balance.low_balance_threshold) {
    return (
      <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">Saldo Baixo</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-700 dark:text-yellow-300">
            Seu saldo está baixo: <strong>{balance.balance} créditos</strong>.
            Considere carregar mais créditos para continuar usando todas as funcionalidades.
          </span>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/credits')}
              className="shrink-0 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Carregar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}












