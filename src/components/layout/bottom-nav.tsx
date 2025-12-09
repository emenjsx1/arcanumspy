"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  FolderTree,
  Users,
  Settings,
  Mic,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/library", label: "Biblioteca", icon: BookOpen },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/voices", label: "Voz IA", icon: Mic },
  { href: "/categories", label: "Categorias", icon: FolderTree },
  { href: "/account", label: "Conta", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pb">
      <div className="grid grid-cols-6 h-16 max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          // Verificar se item tem href válido
          if (!item.href) {
            return null
          }
          
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight text-center px-1",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

