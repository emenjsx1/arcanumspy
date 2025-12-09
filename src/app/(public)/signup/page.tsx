"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Check, ArrowRight, Eye, Mic, Copy, Search, Globe, CheckSquare, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"

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

function SignupFormContent() {
  const router = useRouter()
  const { signup, isLoading } = useAuthStore()
  const { toast } = useToast()

  // Garantir que isLoading seja false ao carregar a página
  useEffect(() => {
    if (isLoading && !useAuthStore.getState().user) {
      // Se isLoading está true mas não há usuário, resetar
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

  const handleFinalSubmit = async (data: SignupFormData) => {
    try {
      // Create user in Supabase
      await signup(data.email, data.password, data.name)

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao ArcanumSpy! Você receberá créditos grátis para começar.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar sua conta",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-black py-12">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-4">
              Criar Conta
            </h1>
            <p className="text-lg text-[#6b6b6b] dark:text-gray-400">
              Preencha os dados abaixo para começar
            </p>
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
                      {isLoading ? "Criando conta..." : "Criar Conta"}
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
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-[#ff5a1f] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">Comunidade</p>
                        <p className="text-xs text-[#6b6b6b] dark:text-gray-400">Conecte-se com outros afiliados</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#6b6b6b] dark:text-gray-400 mb-4">
                    E muito mais! Acesse todas as funcionalidades após criar sua conta.
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
