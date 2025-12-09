/**
 * Hook global otimizado para dados de autenticação
 * Evita múltiplas chamadas e re-renders desnecessários
 */

import { useAuthStore } from '@/store/auth-store'
import { useMemo } from 'react'

export function useAuthData() {
  const { user, profile, isAuthenticated, isLoading, initialize } = useAuthStore()

  // Memoizar dados do usuário para evitar re-renders
  const authData = useMemo(() => ({
    user,
    profile,
    isAuthenticated,
    isLoading,
    userId: user?.id,
    userEmail: user?.email,
    userName: profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0],
    userRole: profile?.role,
    hasProfile: !!profile,
  }), [user, profile, isAuthenticated, isLoading])

  return {
    ...authData,
    initialize,
  }
}




