"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { Logo } from "@/components/layout/logo"
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
import { Badge } from "@/components/ui/badge"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, initialize, isLoading, profile } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  // CORREÇÃO: Flags para evitar loops e múltiplos redirecionamentos
  const [redirecting, setRedirecting] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)
  // CORREÇÃO: Timeout de segurança para evitar loading infinito (declarar antes de usar)
  const [safetyTimeout, setSafetyTimeout] = useState(false)

  // CORREÇÃO: Inicializar auth apenas uma vez, com controle de estado
  useEffect(() => {
    let isMounted = true
    
    const initAuth = async () => {
      if (initialized || !isMounted) return
      
      setMounted(true)
      
      // CORREÇÃO: Inicializar imediatamente, sem delay desnecessário
      try {
        await initialize()
        
        // Aguardar um pouco para garantir que o perfil foi carregado
        await new Promise(resolve => setTimeout(resolve, 200))
        
        if (!isMounted) return
        
        // Se o perfil não foi carregado, tentar refresh apenas uma vez
        const currentState = useAuthStore.getState()
        if (currentState.isAuthenticated && !currentState.profile && !profileChecked) {
          setProfileChecked(true)
          await currentState.refreshProfile()
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
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

  // CORREÇÃO: Timeout de segurança para evitar loading infinito
  useEffect(() => {
    // Timeout de segurança: se após 3 segundos ainda não inicializou, permitir renderização
    const timeout = setTimeout(() => {
      setSafetyTimeout(true)
      if (!initialized) {
        setInitialized(true) // Forçar inicialização após timeout
      }
    }, 3000) // Aumentado para 3 segundos
    
    return () => clearTimeout(timeout)
  }, [])

  // CORREÇÃO: Verificar autenticação e perfil apenas após inicialização completa
  useEffect(() => {
    // Não fazer nada se ainda não inicializou ou está carregando
    if (!mounted || !initialized || isLoading) return
    
    // CORREÇÃO: Se passou o timeout de segurança, não redirecionar automaticamente
    // Deixar o usuário ver a página mesmo se a autenticação ainda está verificando
    if (safetyTimeout) return
    
    // CORREÇÃO: Evitar redirecionamentos múltiplos
    if (redirecting) return

    // CORREÇÃO: Verificar autenticação primeiro
    if (!isAuthenticated) {
      if (!redirecting) {
        setRedirecting(true)
        router.replace("/login")
        setTimeout(() => setRedirecting(false), 1000)
      }
      return
    }
    
    // CORREÇÃO: Verificar perfil apenas uma vez após carregar
    if (!profile && !profileChecked) {
      setProfileChecked(true)
      const timeoutId = setTimeout(async () => {
        const stateBeforeRefresh = useAuthStore.getState()
        if (!stateBeforeRefresh.profile && !redirecting) {
          await stateBeforeRefresh.refreshProfile()
          await new Promise(resolve => setTimeout(resolve, 300))
          
          const updatedState = useAuthStore.getState()
          if (updatedState.profile?.role !== 'admin') {
            if (!redirecting) {
              setRedirecting(true)
              router.replace("/dashboard")
              setTimeout(() => setRedirecting(false), 1000)
            }
          }
        }
      }, 500)
      return () => clearTimeout(timeoutId)
    }
    
    // CORREÇÃO: Verificar role apenas se perfil existe
    if (profile && profile.role !== 'admin' && !redirecting) {
      setRedirecting(true)
      router.replace("/dashboard")
      setTimeout(() => setRedirecting(false), 1000)
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, initialized, isAuthenticated, isLoading, profile, profileChecked, redirecting, safetyTimeout])

  // CORREÇÃO: Mostrar loading apenas se ainda não inicializou E não passou o timeout de segurança
  // Se passou o timeout, sempre permitir renderização (mesmo que ainda esteja carregando)
  const shouldShowLoading = (!mounted || (!initialized && !safetyTimeout) || (isLoading && !safetyTimeout))
  
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

  // CORREÇÃO: Se não está autenticado ou não é admin, mostrar loading (já redirecionou)
  // Mas apenas se não passou o timeout de segurança (para evitar bloqueio infinito)
  if ((!isAuthenticated || profile?.role !== 'admin' || redirecting) && !safetyTimeout) {
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top Navigation Bar (App Bar) fixa no topo */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-white/95 dark:bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60 safe-area-pt">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          {/* Logo à esquerda */}
          <div className="flex items-center gap-3">
            <Logo href="/admin/dashboard" />
            {/* Menu hambúrguer (mobile) - ao lado da logo */}
            <div className="md:hidden">
              <MobileMenu />
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
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
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function ProfileDropdown() {
  const { user, profile, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Dashboard Admin
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={async () => {
              await logout()
              router.push('/login')
            }}
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
