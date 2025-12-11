"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { Sidebar } from "@/components/layout/sidebar"
import { Logo } from "@/components/layout/logo"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, User, CreditCard, LogOut, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, initialize, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  // CORREÇÃO: Flag para evitar múltiplos redirecionamentos simultâneos
  const [redirecting, setRedirecting] = useState(false)
  const [initialized, setInitialized] = useState(false)
  // CORREÇÃO: Timeout de segurança para evitar loading infinito (declarar antes de usar)
  const [safetyTimeout, setSafetyTimeout] = useState(false)
  const [hasActivePayment, setHasActivePayment] = useState<boolean | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(true)

  // CORREÇÃO: Inicializar auth apenas uma vez, com controle de estado
  useEffect(() => {
    let isMounted = true
    
    const initAuth = async () => {
      if (initialized || !isMounted) return
      
      setMounted(true)
      
      // CORREÇÃO: Inicializar imediatamente, sem delay desnecessário
      // O delay estava causando o problema de "Carregando..." infinito
      try {
        await initialize()
        if (isMounted) {
          setInitialized(true)
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error)
        if (isMounted) {
          setInitialized(true) // Marcar como inicializado mesmo em erro
        }
      }
    }
    
    // Executar imediatamente
    initAuth()
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez na montagem

  // CORREÇÃO: Verificar autenticação apenas após inicialização completa
  useEffect(() => {
    // Não fazer nada se ainda não inicializou ou está carregando
    if (!mounted || !initialized || isLoading) return
    
    // CORREÇÃO: Se passou o timeout de segurança, não redirecionar automaticamente
    // Deixar o usuário ver a página mesmo se a autenticação ainda está verificando
    if (safetyTimeout) return
    
    // CORREÇÃO: Evitar redirecionamentos múltiplos
    if (redirecting) return

    // CORREÇÃO: Verificar estado inconsistente (isAuthenticated: true mas user: null)
    if (isAuthenticated && !user) {
      // Estado inconsistente - resetar e redirecionar apenas uma vez
      if (!redirecting) {
        setRedirecting(true)
        const timeoutId = setTimeout(() => {
          router.replace("/login")
        }, 100)
        return () => {
          clearTimeout(timeoutId)
          // Resetar flag após um tempo
          setTimeout(() => setRedirecting(false), 500)
        }
      }
      return
    }

    // CORREÇÃO: Redirecionar apenas se realmente não está autenticado
    // E apenas se não passou o timeout de segurança
    if (!isAuthenticated && !redirecting && !safetyTimeout) {
      setRedirecting(true)
      const timeoutId = setTimeout(() => {
        router.replace("/login")
      }, 500) // Aumentar delay para dar tempo da autenticação carregar
      return () => {
        clearTimeout(timeoutId)
        // Resetar flag após um tempo
        setTimeout(() => setRedirecting(false), 500)
      }
    }
    // CORREÇÃO: Remover 'user' das dependências para evitar re-renders desnecessários
    // O 'isAuthenticated' já reflete o estado do usuário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, initialized, isAuthenticated, isLoading, redirecting, safetyTimeout])

  // CORREÇÃO: Timeout de segurança para evitar loading infinito
  useEffect(() => {
    // Timeout de segurança: se após 2 segundos ainda não inicializou, permitir renderização
    const timeout = setTimeout(() => {
      setSafetyTimeout(true)
    }, 2000)
    
    return () => clearTimeout(timeout)
  }, [])

  // Verificar se usuário tem pagamento confirmado - SEMPRE que mudar de rota
  useEffect(() => {
    const checkPayment = async () => {
      if (!user || !isAuthenticated) {
        setCheckingPayment(false)
        setHasActivePayment(false)
        return
      }

      try {
        const response = await fetch('/api/payment/check', {
          credentials: 'include',
          cache: 'no-store', // Não usar cache para garantir dados atualizados
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('🔍 [Layout] Verificação de pagamento:', data)
          setHasActivePayment(data.hasActivePayment || false)
        } else {
          console.warn('⚠️ [Layout] Erro ao verificar pagamento:', response.status)
          setHasActivePayment(false)
        }
      } catch (error) {
        console.error('❌ [Layout] Erro ao verificar pagamento:', error)
        setHasActivePayment(false)
      } finally {
        setCheckingPayment(false)
      }
    }

    if (isAuthenticated && user && initialized) {
      checkPayment()
    }
  }, [isAuthenticated, user, initialized, pathname]) // Adicionar pathname para verificar em cada mudança de rota

  // BLOQUEAR ACESSO IMEDIATAMENTE se não tem pagamento - verificar em TODAS as rotas
  useEffect(() => {
    // Não fazer nada se ainda está verificando
    if (checkingPayment) return
    
    // Não fazer nada se não está autenticado (já será redirecionado pelo outro useEffect)
    if (!isAuthenticated || !user) return
    
    // Se não tem pagamento ativo E não está na página de checkout
    if (hasActivePayment === false && pathname && !pathname.includes('/checkout')) {
      // Bloquear imediatamente e redirecionar
      if (!redirecting) {
        setRedirecting(true)
        toast({
          title: "Pagamento Necessário",
          description: "Você precisa completar o pagamento para acessar a plataforma. Escolha um plano para continuar.",
          variant: "destructive",
          duration: 5000
        })
        router.replace('/checkout?plan=mensal')
      }
    }
  }, [hasActivePayment, checkingPayment, isAuthenticated, user, redirecting, router, toast, pathname])
  
  // CORREÇÃO: Mostrar loading apenas se ainda não inicializou E não passou o timeout de segurança
  // Se passou o timeout, sempre permitir renderização (mesmo que ainda esteja carregando)
  const shouldShowLoading = (!mounted || (!initialized && !safetyTimeout) || (isLoading && !safetyTimeout) || checkingPayment)
  
  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // BLOQUEAR ACESSO se não tem pagamento confirmado (exceto checkout e billing)
  // Verificar usando pathname em vez de window.location para SSR
  const isCheckoutPage = pathname?.includes('/checkout') || pathname?.includes('/billing')
  
  if (!checkingPayment && hasActivePayment === false && isAuthenticated && user && !isCheckoutPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Pagamento Necessário</h2>
          <p className="text-muted-foreground mb-6">
            Você precisa completar o pagamento para acessar a plataforma. Escolha um plano para continuar.
          </p>
          <Button onClick={() => router.push('/checkout?plan=mensal')} className="bg-[#ff5a1f] hover:bg-[#ff4d29]">
            Escolher Plano e Pagar
          </Button>
        </div>
      </div>
    )
  }

  // CORREÇÃO: Se não está autenticado após verificação completa, mostrar loading (já redirecionou)
  // Mas apenas se não passou o timeout de segurança (para evitar bloqueio infinito)
  if ((!isAuthenticated || redirecting) && !safetyTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    )
  }
  
  // CORREÇÃO: Se passou o timeout e ainda não está autenticado, permitir renderização
  // O useEffect de redirecionamento vai cuidar do redirect
  if (!isAuthenticated && safetyTimeout) {
    // Não bloquear, deixar o useEffect redirecionar
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black" suppressHydrationWarning>
      {/* Top Navigation Bar (App Bar) fixa no topo */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b bg-white/95 dark:bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60 safe-area-pt">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          {/* Logo à esquerda */}
          <div className="flex items-center gap-3">
            <Logo href="/dashboard" />
            {/* Menu hambúrguer (mobile) - ao lado da logo */}
            <div className="md:hidden">
              <MobileMenu />
            </div>
          </div>
          
          {/* Controles à direita */}
          <div className="flex items-center gap-2 md:gap-4">
            <ProfileDropdown />
          </div>
        </div>
      </header>
      
      {/* Espaçamento para compensar header fixo */}
      <div className="h-14 md:h-16" />

      {/* Layout principal: Sidebar + Conteúdo */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Área de conteúdo */}
        <main className="flex-1 min-w-0">
          <div className="p-3 md:p-4 lg:p-6 xl:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function ProfileDropdown() {
  const { user, profile, logout, refreshProfile } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // OTIMIZAÇÃO: Evitar múltiplas chamadas de refreshProfile
  useEffect(() => {
    setMounted(true)
  }, [])

  // OTIMIZAÇÃO: Carregar perfil apenas uma vez quando necessário
  useEffect(() => {
    if (!user?.id || profile) return

    // Debounce para evitar múltiplas chamadas
    const timer = setTimeout(() => {
      refreshProfile().catch(() => {
        // Ignorar erros silenciosamente
      })
    }, 500) // Aumentar delay para evitar chamadas rápidas

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Apenas quando user.id mudar

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex items-center gap-2">
      {/* Toggle de tema */}
      {mounted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Escuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {/* Avatar e dropdown do usuário */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 md:px-3">
            <User className="h-4 w-4" />
            <span className="hidden md:inline text-sm font-medium">{profile?.name || user?.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{profile?.name || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          {profile?.role === 'admin' && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  Área Admin
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild>
            <Link href="/account" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/billing" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              Planos e Cobrança
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
