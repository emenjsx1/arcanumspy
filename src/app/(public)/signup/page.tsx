"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Check, ArrowRight, ArrowLeft, Mic, Copy, Search, Globe, CheckSquare, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import clsx from "clsx"

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos de uso",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

const PLANS = {
  mensal: {
    name: "Mensal",
    price: 800,
    months: 1,
    period: "mês",
    description: "Plano mensal ideal para começar",
    features: [
      "Acesso completo à plataforma",
      "Biblioteca de ofertas escaladas",
      "IA de voz e copy",
      "Ferramentas de espionagem",
      "Produtividade completa",
      "Suporte por email"
    ]
  },
  trimestral: {
    name: "Trimestral",
    price: 2160, // 800 * 3 * 0.9 (10% desconto)
    months: 3,
    period: "3 meses",
    description: "Economize 10% com o plano trimestral",
    savings: 240, // 2400 - 2160
    features: [
      "Tudo do plano mensal",
      "Economia de 240 MT",
      "Suporte prioritário",
      "Atualizações antecipadas"
    ]
  },
  anual: {
    name: "Anual",
    price: 7680, // 800 * 12 * 0.8 (20% desconto)
    months: 12,
    period: "ano",
    description: "Melhor custo-benefício - Economize 20%",
    savings: 1920, // 9600 - 7680
    features: [
      "Tudo do plano trimestral",
      "Economia de 1920 MT",
      "Suporte 24/7",
      "Acesso beta a novas funcionalidades",
      "Consultoria mensal gratuita"
    ]
  }
}

type PlanKey = keyof typeof PLANS

function SignupFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signup, isLoading, user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  
  const [step, setStep] = useState<'plan' | 'form'>('plan')
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>((searchParams.get('plan') as PlanKey) || 'mensal')

  // Garantir que isLoading seja false ao carregar a página
  useEffect(() => {
    if (isLoading && !useAuthStore.getState().user) {
      useAuthStore.setState({ isLoading: false })
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      acceptTerms: false,
    },
  })

  const handlePlanSelect = () => {
    // Se o usuário já está autenticado, ir direto para o checkout
    if (isAuthenticated && user) {
      router.push(`/checkout?plan=${selectedPlan}`)
      return
    }
    // Se não está autenticado, seguir o fluxo normal (formulário de signup)
    setStep('form')
  }

  const handleFinalSubmit = async (data: SignupFormData) => {
    try {
      // Create user in Supabase
      await signup(data.email, data.password, data.name)

      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para finalizar o pagamento...",
      })

      // Redirecionar para checkout com o plano selecionado
      router.push(`/checkout?plan=${selectedPlan}`)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar sua conta",
        variant: "destructive",
      })
    }
  }

  // Step 1: Seleção de Plano
  if (step === 'plan') {
    return (
      <div className="min-h-screen bg-[#f9f9f9] dark:bg-black py-12">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-4">
                Escolha seu Plano
              </h1>
              <p className="text-lg text-[#6b6b6b] dark:text-gray-400">
                Selecione o plano ideal para você e comece a escalar seus resultados
              </p>
            </div>

            {/* Planos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {Object.entries(PLANS).map(([key, plan]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Card 
                    className={clsx(
                      "flex flex-col h-full bg-white dark:bg-[#1a1a1a] border-2 cursor-pointer transition-all",
                      selectedPlan === key
                        ? "border-[#ff5a1f] dark:border-[#ff5a1f] ring-2 ring-[#ff5a1f] shadow-lg"
                        : "border-gray-200 dark:border-gray-800 hover:border-[#ff5a1f]/50"
                    )}
                    onClick={() => setSelectedPlan(key as PlanKey)}
                  >
                    {key === 'anual' && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff5a1f] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                        Mais Popular
                      </Badge>
                    )}
                    <CardHeader className="items-center text-center pb-6">
                      <CardTitle className="text-2xl font-bold text-[#0b0c10] dark:text-white mb-2">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-[#6b6b6b] dark:text-gray-400">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-between pt-0">
                      <div className="mb-6 text-center w-full">
                        <span className="text-4xl font-bold text-[#ff5a1f]">
                          {plan.price.toLocaleString('pt-MZ')} MT
                        </span>
                        <span className="text-lg text-[#6b6b6b] dark:text-gray-400">/{plan.period}</span>
                        {'savings' in plan && plan.savings && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Economize {plan.savings.toLocaleString('pt-MZ')} MT
                          </p>
                        )}
                      </div>
                      <ul className="space-y-3 text-sm text-[#6b6b6b] dark:text-gray-400 text-left w-full mb-8">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-[#ff5a1f] flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="w-full">
                        <RadioGroup value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as PlanKey)}>
                          <div className="flex items-center justify-center space-x-2">
                            <RadioGroupItem value={key} id={key} />
                            <Label htmlFor={key} className="cursor-pointer text-sm font-medium">
                              {selectedPlan === key ? 'Selecionado' : 'Selecionar'}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Botão Continuar */}
            <div className="text-center">
              <Button
                onClick={handlePlanSelect}
                className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg"
                size="lg"
              >
                {isAuthenticated && user ? 'Ir para Pagamento' : `Continuar com ${PLANS[selectedPlan].name}`}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm text-[#6b6b6b] dark:text-gray-400">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-[#ff5a1f] hover:underline font-semibold">
                  Entrar
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Step 2: Formulário de Cadastro
  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-black py-12">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header com botão voltar */}
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setStep('plan')}
              className="mb-4 text-[#6b6b6b] dark:text-gray-400 hover:text-[#ff5a1f]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para seleção de plano
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-4">
              Criar Conta
            </h1>
            <p className="text-lg text-[#6b6b6b] dark:text-gray-400">
              Preencha os dados abaixo para criar sua conta
            </p>
            <Badge className="mt-4 bg-[#ff5a1f]/10 text-[#ff5a1f] border-[#ff5a1f]/20">
              Plano selecionado: {PLANS[selectedPlan].name} - {PLANS[selectedPlan].price.toLocaleString('pt-MZ')} MT
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] shadow-xl rounded-2xl p-8">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-[#0b0c10] dark:text-white">
                  Dados da Conta
                </CardTitle>
                <CardDescription className="text-[#6b6b6b] dark:text-gray-400">
                  Informações básicas para criar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#0b0c10] dark:text-white font-semibold">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      placeholder="João Silva"
                      className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl focus:border-[#ff5a1f] focus:ring-[#ff5a1f]"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#0b0c10] dark:text-white font-semibold">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl focus:border-[#ff5a1f] focus:ring-[#ff5a1f]"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#0b0c10] dark:text-white font-semibold">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl focus:border-[#ff5a1f] focus:ring-[#ff5a1f]"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[#0b0c10] dark:text-white font-semibold">
                      Confirmar Senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl focus:border-[#ff5a1f] focus:ring-[#ff5a1f]"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3 pt-4">
                    <input
                      type="checkbox"
                      id="terms"
                      {...register("acceptTerms")}
                      className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] text-[#ff5a1f] focus:ring-[#ff5a1f]"
                    />
                    <Label htmlFor="terms" className="text-sm text-[#6b6b6b] dark:text-gray-400 leading-relaxed">
                      Eu aceito os{" "}
                      <Link href="/terms" className="text-[#ff5a1f] hover:underline font-semibold">
                        Termos de Uso
                      </Link>{" "}
                      e{" "}
                      <Link href="/privacy" className="text-[#ff5a1f] hover:underline font-semibold">
                        Política de Privacidade
                      </Link>
                    </Label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full py-6 text-lg font-semibold shadow-lg" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Criando conta..." : "Criar Conta e Ir para Pagamento"}
                      {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                  </motion.div>
                </form>

                <p className="mt-6 text-center text-sm text-[#6b6b6b] dark:text-gray-400">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-[#ff5a1f] hover:underline font-semibold">
                    Entrar
                  </Link>
                </p>
              </CardContent>
            </Card>

            {/* Plataforma Completa */}
            <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] shadow-xl rounded-2xl p-8">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-[#0b0c10] dark:text-white">
                  Plataforma Completa
                </CardTitle>
                <CardDescription className="text-[#6b6b6b] dark:text-gray-400">
                  Todas as ferramentas que você precisa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-[#ff5a1f]/10 dark:bg-[#ff5a1f]/20 border border-[#ff5a1f]/20 dark:border-[#ff5a1f]/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#0b0c10] dark:text-white mb-3">
                    🚀 O que você tem acesso?
                  </h3>
                  <p className="text-sm text-[#6b6b6b] dark:text-gray-400 leading-relaxed mb-4">
                    O ArcanumSpy oferece uma plataforma completa com todas as ferramentas de marketing, IA, espionagem e produtividade em um único lugar.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-3">
                      <Search className="w-5 h-5 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">Biblioteca de Ofertas</p>
                        <p className="text-xs text-[#6b6b6b] dark:text-gray-400">Milhares de ofertas escaladas</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mic className="w-5 h-5 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">IA de Voz</p>
                        <p className="text-xs text-[#6b6b6b] dark:text-gray-400">Clone vozes e gere narrações</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Copy className="w-5 h-5 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">Gerador de Copy IA</p>
                        <p className="text-xs text-[#6b6b6b] dark:text-gray-400">Copy profissional com IA</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">Espionagem</p>
                        <p className="text-xs text-[#6b6b6b] dark:text-gray-400">Domínios, ofertas e criativos</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckSquare className="w-5 h-5 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">Produtividade</p>
                        <p className="text-xs text-[#6b6b6b] dark:text-gray-400">Tarefas, metas, anotações e mais</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#6b6b6b] dark:text-gray-400 mb-4">
                    E muito mais! Acesse todas as funcionalidades após criar sua conta e finalizar o pagamento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <SignupFormContent />
    </Suspense>
  )
}
