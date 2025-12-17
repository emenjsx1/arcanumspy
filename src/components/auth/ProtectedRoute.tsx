"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Componente ProtectedRoute
 * Bloqueia acesso se o usuário não estiver autenticado
 * Mostra modal com opção de fazer login
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (!isAuthenticated) {
      setShowModal(true)
    }
  }, [mounted, isLoading, isAuthenticated])

  const handleLogin = () => {
    setShowModal(false)
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
  }

  // Mostrar loading enquanto verifica autenticação
  if (!mounted || isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não está autenticado, mostrar modal
  if (!isAuthenticated) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-muted-foreground">Redirecionando para login...</p>
            </div>
          </div>
        )}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Acesso Restrito</DialogTitle>
              <DialogDescription>
                Você precisa estar autenticado para acessar esta página.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                onClick={handleLogin}
                className="w-full sm:w-auto"
              >
                Fazer Login
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full sm:w-auto"
              >
                Voltar ao Início
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Usuário autenticado - renderizar conteúdo
  return <>{children}</>
}










