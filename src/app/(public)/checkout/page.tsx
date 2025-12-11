"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Check, Loader2, ArrowLeft, CreditCard, Smartphone, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { supabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const PLANS = {
  mensal: {
    name: "Mensal",
    price: 800,
    months: 1,
    period: "mês"
  },
  trimestral: {
    name: "Trimestral",
    price: 2160, // 800 * 3 * 0.9
    months: 3,
    period: "3 meses",
    savings: 240
  },
  anual: {
    name: "Anual",
    price: 7680, // 800 * 12 * 0.8
    months: 12,
    period: "ano",
    savings: 1920
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuthStore()
  
  const planParam = searchParams.get('plan') || 'mensal'
  const selectedPlan = PLANS[planParam as keyof typeof PLANS] || PLANS.mensal
  
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola'>('mpesa')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'plan' | 'payment'>('plan')
  const [showProcessingDialog, setShowProcessingDialog] = useState(false)

  // Permitir acesso ao checkout mesmo sem autenticação (usuário pode vir do signup)
  // Mas mostrar mensagem se não estiver autenticado

  const validatePhone = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '')
    return /^(84|85|86|87)\d{7}$/.test(digits)
  }

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer o pagamento",
        variant: "destructive"
      })
      return
    }

    // Validar telefone
    if (!validatePhone(phone)) {
      toast({
        title: "Telefone inválido",
        description: "Use um número válido de Moçambique (84, 85, 86 ou 87) com 9 dígitos",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Limpar telefone
      let phoneDigits = phone.replace(/\D/g, '')
      if (phoneDigits.startsWith('258')) {
        phoneDigits = phoneDigits.substring(3)
      } else if (phoneDigits.startsWith('00258')) {
        phoneDigits = phoneDigits.substring(5)
      }

      // Gerar referência única
      const reference = `ArcanumSpy-${Date.now()}`

      // Obter token de autenticação
      let accessToken: string | null = null
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError)
        }
        
        accessToken = session?.access_token || null
        
        // Se não conseguir via getSession, tentar obter do usuário atual
        if (!accessToken && user) {
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          if (currentUser) {
            // Tentar obter token da sessão novamente
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            accessToken = retrySession?.access_token || null
          }
        }
      } catch (error) {
        console.error('Erro ao obter token:', error)
      }

      if (!accessToken) {
        console.error('❌ [Checkout] Token de autenticação não encontrado')
        toast({
          title: "Erro de autenticação",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
          variant: "destructive"
        })
        router.push('/login')
        return
      }
      
      console.log('✅ [Checkout] Token obtido, enviando requisição de pagamento')

      // Mostrar popup de processamento
      setShowProcessingDialog(true)

      // Chamar API de pagamento
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: selectedPlan.price,
          phone: phoneDigits,
          method: paymentMethod,
          reference: reference,
          plan: selectedPlan.name,
          months: selectedPlan.months,
          user_id: user.id
        }),
      })

      const data = await response.json()

      // Fechar popup de processamento
      setShowProcessingDialog(false)

      if (data.success) {
        toast({
          title: "Pagamento processado!",
          description: "Sua conta será ativada em instantes. Redirecionando...",
        })

        // Aguardar 2 segundos e redirecionar
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        // Tratar erros específicos
        let errorTitle = "Erro no pagamento"
        let errorMessage = data.message || "Ocorreu um erro ao processar o pagamento"
        
        // Erro 422 = Saldo insuficiente
        if (response.status === 422 || data.error_type === 'insufficient_balance') {
          errorTitle = "Saldo insuficiente"
          errorMessage = "Você não tem saldo suficiente na sua conta M-Pesa/e-Mola. Por favor, recarregue sua conta e tente novamente."
        } else if (response.status === 401 && data.error_type === 'token_expired') {
          errorTitle = "Token expirado"
          errorMessage = "O token de acesso expirou. Por favor, tente novamente mais tarde ou entre em contato com o suporte."
        } else if (response.status === 400) {
          errorTitle = "Dados inválidos"
          errorMessage = data.message || "Verifique os dados informados e tente novamente."
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive"
        })
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      
      // Fechar popup de processamento em caso de erro
      setShowProcessingDialog(false)
      
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] dark:bg-black py-12">
        <div className="container px-4 md:px-6 max-w-4xl">
          <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-2xl text-[#0b0c10] dark:text-white">
                Faça login para continuar
              </CardTitle>
              <CardDescription>
                Você precisa estar logado para fazer o pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/signup?redirect=/checkout?plan=${planParam}`}>
                <Button className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
                  Criar Conta
                </Button>
              </Link>
              <Link href={`/login?redirect=/checkout?plan=${planParam}`}>
                <Button variant="outline" className="w-full">
                  Já tenho conta
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-black py-12">
      <div className="container px-4 md:px-6 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-[#6b6b6b] dark:text-gray-400 hover:text-[#ff5a1f] mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumo do Pedido */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-2xl text-[#0b0c10] dark:text-white">
                  Finalizar Pagamento
                </CardTitle>
                <CardDescription>
                  Complete seu pagamento para ativar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seleção de Método de Pagamento */}
                <div>
                  <Label className="text-base font-semibold text-[#0b0c10] dark:text-white mb-4 block">
                    Método de Pagamento
                  </Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'mpesa' | 'emola')} className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="mpesa" id="mpesa" className="peer sr-only" />
                      <Label
                        htmlFor="mpesa"
                        className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          paymentMethod === 'mpesa'
                            ? 'border-[#ff5a1f] bg-[#ff5a1f]/10'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <Smartphone className="h-8 w-8 text-[#ff5a1f] mb-2" />
                        <span className="font-semibold text-[#0b0c10] dark:text-white">M-Pesa</span>
                        <span className="text-xs text-[#6b6b6b] dark:text-gray-400">Vodacom</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="emola" id="emola" className="peer sr-only" />
                      <Label
                        htmlFor="emola"
                        className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          paymentMethod === 'emola'
                            ? 'border-[#ff5a1f] bg-[#ff5a1f]/10'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <Smartphone className="h-8 w-8 text-[#ff5a1f] mb-2" />
                        <span className="font-semibold text-[#0b0c10] dark:text-white">e-Mola</span>
                        <span className="text-xs text-[#6b6b6b] dark:text-gray-400">Movitel</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Número de Telefone */}
                <div>
                  <Label htmlFor="phone" className="text-base font-semibold text-[#0b0c10] dark:text-white">
                    Número de Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="841234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2"
                    maxLength={9}
                  />
                  <p className="text-xs text-[#6b6b6b] dark:text-gray-400 mt-1">
                    Digite apenas os 9 dígitos (ex: 841234567)
                  </p>
                </div>

                {/* Botão de Pagamento */}
                <Button
                  onClick={handlePayment}
                  disabled={loading || !phone || !validatePhone(phone)}
                  className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full py-6 text-lg font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Pagar {selectedPlan.price.toLocaleString('pt-MZ')} MT
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg text-[#0b0c10] dark:text-white">
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#6b6b6b] dark:text-gray-400">Plano</span>
                    <span className="font-semibold text-[#0b0c10] dark:text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#6b6b6b] dark:text-gray-400">Período</span>
                    <span className="text-sm text-[#0b0c10] dark:text-white">{selectedPlan.period}</span>
                  </div>
                  {'savings' in selectedPlan && selectedPlan.savings && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-green-600 dark:text-green-400">Economia</span>
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        -{selectedPlan.savings.toLocaleString('pt-MZ')} MT
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-[#0b0c10] dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-[#ff5a1f]">
                      {selectedPlan.price.toLocaleString('pt-MZ')} MT
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-2 text-xs text-[#6b6b6b] dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                    <span>Acesso imediato após pagamento</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                    <span>Cancelamento a qualquer momento</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                    <span>Suporte prioritário</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de Processamento */}
        <Dialog open={showProcessingDialog} onOpenChange={(open) => {
          // Não permitir fechar manualmente durante processamento
          if (!open && loading) return
          setShowProcessingDialog(open)
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#0b0c10] dark:text-white">
                <Loader2 className="h-5 w-5 animate-spin text-[#ff5a1f]" />
                Processando Pagamento
              </DialogTitle>
              <DialogDescription className="text-[#6b6b6b] dark:text-gray-400 pt-2">
                <div className="space-y-3">
                  <p className="font-medium text-base text-[#0b0c10] dark:text-white">
                    Está processando...
                  </p>
                  <p>
                    Vai aparecer no seu celular uma solicitação para inserir o PIN do seu {paymentMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'}.
                  </p>
                  <p className="text-sm">
                    Por favor, confirme o pagamento no seu celular para continuar.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f]" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

