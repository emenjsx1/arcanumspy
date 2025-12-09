"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/layout/logo"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading: authIsLoading, initialize } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Garantir que isLoading do auth não interfira na página de login
  useEffect(() => {
    // Inicializar auth mas não bloquear a página
    initialize().catch(console.error)
  }, [initialize])

  // Usar isSubmitting local em vez de isLoading global
  const isLoading = isSubmitting

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true)
      await login(data.email, data.password)
      
      // Aguardar um pouco para garantir que o perfil foi carregado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recarregar o perfil para garantir que está atualizado
      const { refreshProfile } = useAuthStore.getState()
      await refreshProfile()
      
      // Aguardar mais um pouco após refresh
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verificar novamente após refresh - tentar múltiplas vezes
      let updatedProfile = useAuthStore.getState().profile
      let attempts = 0
      
      while (!updatedProfile && attempts < 3) {
        await new Promise(resolve => setTimeout(resolve, 500))
        await refreshProfile()
        updatedProfile = useAuthStore.getState().profile
        attempts++
      }
      
      
      toast({
        title: "Login realizado com sucesso!",
        description: updatedProfile?.role === 'admin' ? "Bem-vindo, Admin!" : "Bem-vindo de volta!",
      })
      
      // Check if user is admin
      if (updatedProfile?.role === 'admin') {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-[#ff5a1f] p-4 rounded-lg">
            <Logo href="/" className="text-white" />
          </div>
        </div>

        {/* Card de Login */}
        <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#0b0c10] dark:text-white">Entrar</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Digite seu email e senha para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0b0c10] dark:text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#ff5a1f]"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-[#ff5a1f]">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#0b0c10] dark:text-white">Senha</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#ff5a1f] hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#ff5a1f]"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-[#ff5a1f]">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white" 
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Não tem uma conta?{" "}
              <Link href="/signup" className="text-[#ff5a1f] hover:underline font-semibold">
                Cadastre-se
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

