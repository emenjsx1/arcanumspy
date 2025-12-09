"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"
import { usePathname } from "next/navigation"

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isAdminArea = pathname?.startsWith("/admin")

  const closeMenu = () => setOpen(false)

  // Fechar menu quando a rota mudar
  useEffect(() => {
    closeMenu()
  }, [pathname])

  // Prevenir scroll do body quando menu está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-in fade-in-0"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 z-[70] w-80 max-w-[90vw] border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-300" style={{ backgroundColor: '#0a0a0a' }}>
            {/* Header do Menu */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Logo 
                  href={isAdminArea ? "/admin/dashboard" : "/dashboard"} 
                  showText={true}
                  className="min-w-0"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-muted flex-shrink-0"
                onClick={closeMenu}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Conteúdo do Menu */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ backgroundColor: '#0a0a0a', overflow: 'visible' }}>
              <div className="p-3" style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'visible', backgroundColor: 'transparent' }}>
                <Sidebar
                  className="flex w-full border-0 bg-transparent"
                  onNavigate={closeMenu}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

