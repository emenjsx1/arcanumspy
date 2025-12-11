"use client"

import { useEffect } from 'react'

/**
 * Componente para garantir que o viewport seja mantido corretamente
 * em todas as páginas, especialmente no mobile
 * Previne zoom indesejado e mantém a proporção fixa
 */
export function ViewportFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Função para garantir que a meta viewport esteja correta
    const ensureViewport = () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        // Garantir que o conteúdo do viewport está correto
        const content = viewport.getAttribute('content') || ''
        if (!content.includes('user-scalable=no') || !content.includes('maximum-scale=1.0')) {
          viewport.setAttribute(
            'content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
          )
        }
      }
    }

    // Executar imediatamente
    ensureViewport()

    // Prevenir zoom com gestos de pinça (dois dedos)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    const handleWheel = (e: WheelEvent) => {
      // Prevenir zoom com Ctrl + scroll (Windows) ou Cmd + scroll (Mac)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      }
    }

    // Prevenir zoom com gestos de pinça
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('wheel', handleWheel, { passive: false })

    // Garantir que o viewport seja mantido após mudanças de orientação
    const handleOrientationChange = () => {
      setTimeout(ensureViewport, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', ensureViewport)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('wheel', handleWheel)
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', ensureViewport)
    }
  }, [])

  return null
}

