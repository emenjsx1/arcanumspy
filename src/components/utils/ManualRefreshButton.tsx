"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

/**
 * Botão de Refresh Manual
 * Aparece apenas quando o usuário está logado
 * Limpa cache e recarrega a página
 */
export function ManualRefreshButton() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    
    try {
      // Limpar cache do SWR se existir
      if (typeof window !== 'undefined' && (window as any).swrCache) {
        (window as any).swrCache.clear()
      }

      // Limpar cache do React Query se existir
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        (window as any).queryClient.clear()
      }

      // Limpar cache do Zustand se necessário
      // (Zustand geralmente não precisa de limpeza manual)

      // Recarregar página suavemente
      router.refresh()
      
      // Aguardar um pouco antes de recarregar completamente
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Error refreshing:', error)
      // Fallback: recarregar página normalmente
      window.location.reload()
    } finally {
      setIsRefreshing(false)
    }
  }, [router])

  // Expor função global
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).forceRefresh = handleRefresh
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).forceRefresh
      }
    }
  }, [handleRefresh])

  // Não mostrar se não estiver autenticado
  if (!isAuthenticated) {
    return null
  }

  // Botão invisível mas funcional (pode ser estilizado depois)
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="fixed bottom-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity"
      title="Refresh Manual (F5)"
      aria-label="Refresh Manual"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  )
}

