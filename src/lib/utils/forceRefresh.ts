/**
 * Função global para forçar refresh manual
 * Pode ser chamada via window.forceRefresh() no DevTools
 */

export function forceRefresh() {
  if (typeof window === 'undefined') {
    console.warn('forceRefresh só pode ser chamado no cliente')
    return
  }

  // Limpar cache do SWR se existir
  if ((window as any).swrCache) {
    (window as any).swrCache.clear()
  }

  // Limpar cache do React Query se existir
  if ((window as any).queryClient) {
    (window as any).queryClient.clear()
  }

  // Limpar localStorage de caches específicos
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('swr-') || key.startsWith('react-query-')) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Erro ao limpar localStorage:', error)
  }

  // Recarregar página
  window.location.reload()
}

// Expor globalmente
if (typeof window !== 'undefined') {
  (window as any).forceRefresh = forceRefresh
}










