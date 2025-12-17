"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, initialize, isLoading } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const [safetyTimeout, setSafetyTimeout] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // CORREÇÃO: Inicializar auth apenas uma vez
  useEffect(() => {
    let isMounted = true
    
    const initAuth = async () => {
      if (initialized) return
      
      setMounted(true)
      
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
    
    initAuth()
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez

  // CORREÇÃO: Timeout de segurança para evitar loading infinito
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSafetyTimeout(true)
      if (!initialized) {
        setInitialized(true) // Forçar inicialização após timeout
      }
    }, 3000) // 3 segundos
    
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    // Verificar autenticação e redirecionar apenas após inicialização
    if (mounted && initialized && !isLoading) {
      if (!isAuthenticated) {
        router.replace("/login")
      }
    }
  }, [mounted, initialized, isAuthenticated, isLoading, router])

  // CORREÇÃO: Mostrar loading apenas se ainda não inicializou E não passou timeout
  if (!mounted || (!initialized && !safetyTimeout) || (isLoading && !safetyTimeout)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // CORREÇÃO: Se não está autenticado após verificação, redirecionar
  if (initialized && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top Navigation Bar (App Bar) fixa no topo */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-white/95 dark:bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60 safe-area-pt">
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

  useEffect(() => {
    setMounted(true)
    // CORREÇÃO: Só recarregar perfil se realmente não tiver perfil E tiver usuário
    // Evitar múltiplas chamadas desnecessárias com timeout de segurança
    if (user?.id && !profile) {
      // Usar setTimeout para não bloquear renderização
      const timer = setTimeout(() => {
        const currentState = useAuthStore.getState()
        // Verificar novamente antes de chamar refresh
        if (currentState.user?.id && !currentState.profile) {
          refreshProfile().catch(console.error)
        }
      }, 500) // Aumentado para 500ms para evitar chamadas muito frequentes
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Remover refreshProfile e profile das dependências


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
