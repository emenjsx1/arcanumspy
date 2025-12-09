"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { Logo } from "@/components/layout/logo"
import { Moon, Sun, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { user, profile, isAuthenticated, initialize, isLoading } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let isMounted = true
    const initAuth = async () => {
      try {
        // Sempre inicializar auth para garantir que a sessão seja verificada
        await initialize()
        if (isMounted) {
          setMounted(true)
        }
      } catch (error) {
        console.error('Erro ao inicializar auth no Header:', error)
        if (isMounted) {
          setMounted(true)
        }
      }
    }
    initAuth()
    return () => {
      isMounted = false
    }
  }, [initialize])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60 shadow-sm">
      <div className="container flex h-14 sm:h-16 md:h-20 items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8">
        <Logo href="/" />

        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link href="/pricing" className="text-sm font-medium text-[#0b0c10] dark:text-white hover:text-[#ff5a1f] transition-colors">
            Preços
          </Link>
          <Link href="/about" className="text-sm font-medium text-[#0b0c10] dark:text-white hover:text-[#ff5a1f] transition-colors">
            Sobre
          </Link>
          <Link href="/contact" className="text-sm font-medium text-[#0b0c10] dark:text-white hover:text-[#ff5a1f] transition-colors">
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 md:space-x-4">
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                  <Sun className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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

          {mounted && !isLoading ? (
            isAuthenticated ? (
              <Link href={profile?.role === 'admin' ? "/admin/dashboard" : "/dashboard"}>
                <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">Dashboard</Button>
              </Link>
            ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="border-2 rounded-full text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 hidden sm:inline-flex">Entrar</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">Criar Conta</Button>
              </Link>
            </>
          )
          ) : (
            // Enquanto está carregando, mostrar botões padrão (não autenticado)
            // Isso evita flash de conteúdo incorreto
            <>
              <Link href="/login">
                <Button variant="outline" className="border-2 rounded-full text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 hidden sm:inline-flex">Entrar</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">Criar Conta</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

