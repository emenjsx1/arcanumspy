"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"

export function Footer() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const handleProtectedLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isAuthenticated) {
      e.preventDefault()
      router.push(`/login?redirect=${encodeURIComponent(href)}`)
    }
  }

  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ArcanumSpy</h3>
            <p className="text-sm text-muted-foreground">
              A maior biblioteca de ofertas de Direct Response do mercado.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/library" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={(e) => handleProtectedLink(e, '/library')}
                >
                  Biblioteca
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={(e) => handleProtectedLink(e, '/categories')}
                >
                  Categorias
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={(e) => handleProtectedLink(e, '/dashboard')}
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ArcanumSpy. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

