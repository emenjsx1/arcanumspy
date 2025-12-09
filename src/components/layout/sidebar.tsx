"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  FolderTree,
  Settings,
  CreditCard,
  LogOut,
  Shield,
  Users,
  Mic,
  ChevronDown,
  ChevronRight,
  History,
  Plus,
  FileText,
  Sparkles,
  DollarSign,
  Map,
  Phone,
  Globe,
  Target,
  Star,
  Library,
  Image,
  Type,
  ShoppingCart,
  AudioLines,
  FileAudio,
  Maximize2,
  Eraser,
  TrendingUp,
  CheckCircle2,
  EyeOff,
  Eye,
  Lock,
  Copy,
  CheckSquare,
  Timer,
  Trophy,
  Wallet,
  StickyNote,
  Youtube,
  UserCircle,
  X,
  Link as LinkIcon,
  GraduationCap,
  Mail,
} from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { Logo } from "./logo"

type SidebarProps = {
  className?: string
  onNavigate?: () => void
}

const userNavItems = [
  { 
    href: "/conteudos", 
    label: "Conteúdo", 
    icon: BookOpen, 
    hasSubmenu: true,
    submenu: [
      { href: "/conteudos/mapa-iniciante", label: "Mapa do Iniciante", icon: Map },
      { href: "/conteudos/calls-gravadas", label: "Calls Gravadas", icon: Phone },
      { href: "/conteudos/comunidade", label: "Comunidade", icon: Users },
    ]
  },
  { 
    href: "/espionagem", 
    label: "Espionagem", 
    icon: Globe, 
    hasSubmenu: true,
    submenu: [
      { href: "/espionagem/espiao-dominios", label: "Espião de Domínio", icon: Target },
      { href: "/espionagem/ofertas-escaladas", label: "Ofertas Escaladas", icon: TrendingUp },
      { href: "/espionagem/favoritos", label: "Favorito", icon: Heart },
      { href: "/espionagem/organizador-biblioteca", label: "Organizador de Biblioteca", icon: Library },
    ]
  },
  { 
    href: "/ias", 
    label: "IA'", 
    icon: Sparkles, 
    hasSubmenu: true,
    submenu: [
      { href: "/ias/criador-criativo", label: "Criador de Criativo", icon: Image },
      { href: "/ias/gerador-copy-criativo", label: "Gerador de Copy de Criativo", icon: Type },
      { href: "/ias/gerador-upsell", label: "Gerador de Upsell", icon: ShoppingCart },
      { href: "/ias/gerador-voz", label: "Gerador de Voz", icon: Mic },
      { href: "/ias/transcrever-audio", label: "Transcrever Áudio", icon: FileAudio },
      { href: "/ias/upscale", label: "Upscale", icon: Maximize2 },
      { href: "/ias/remover-background", label: "Remover Background", icon: Eraser },
    ]
  },
  { 
    href: "/ferramentas", 
    label: "Ferramenta", 
    icon: Settings, 
    hasSubmenu: true,
    submenu: [
      { href: "/ferramentas/otimizador-campanha", label: "Otimizador de Campanha", icon: TrendingUp },
      { href: "/ferramentas/validador-criativo", label: "Validador de Criativo", icon: CheckCircle2 },
      { href: "/ferramentas/mascarar-criativo", label: "Mascarar Criativo", icon: EyeOff },
      { href: "/ferramentas/esconder-criativo", label: "Esconder Criativo", icon: Eye },
      { href: "/ferramentas/criptografar-texto", label: "Criptografar Texto", icon: Lock },
      { href: "/ferramentas/clonador", label: "Clonador", icon: Copy },
    ]
  },
  { 
    href: "/produtividade", 
    label: "Produtividade", 
    icon: CheckSquare, 
    hasSubmenu: true,
    submenu: [
      { href: "/produtividade/tarefa", label: "Tarefa", icon: CheckSquare },
      { href: "/produtividade/cronometro", label: "Cronômetro", icon: Timer },
      { href: "/produtividade/meta", label: "Meta", icon: Trophy },
      { href: "/produtividade/financeiro", label: "Financeiro", icon: Wallet },
      { href: "/produtividade/anotacoes", label: "Anotações", icon: StickyNote },
    ]
  },
  { 
    href: "/links-uteis", 
    label: "Links Úteis", 
    icon: LinkIcon, 
    hasSubmenu: true,
    submenu: [
      { href: "/links-uteis/canal-youtube", label: "Canal no YouTube", icon: Youtube },
      { href: "/links-uteis/mentoria-individual", label: "Mentoria Individual", icon: UserCircle },
    ]
  },
]

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuários", icon: Shield },
  { href: "/admin/offers", label: "Ofertas", icon: BookOpen },
  { href: "/admin/categories", label: "Categorias", icon: FolderTree },
  { href: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/admin/calls-gravadas", label: "Calls Gravadas", icon: Phone },
  { href: "/admin/communities", label: "Comunidades", icon: Users },
  { href: "/admin/plans", label: "Planos", icon: CreditCard },
  { href: "/admin/financial", label: "Financeiro", icon: DollarSign },
  { href: "/admin/comunicacao", label: "Comunicação", icon: Mail },
  { href: "/admin/content", label: "Conteúdo", icon: Settings },
  { href: "/admin/logs", label: "Logs", icon: Shield },
  { href: "/admin/support", label: "Suporte", icon: Heart },
]

export function Sidebar({ className, onNavigate }: SidebarProps = {}) {
  const pathname = usePathname()
  const { profile, isAuthenticated } = useAuthStore()
  const isAdminArea = pathname?.startsWith("/admin")
  const isAdmin = profile?.role === "admin"
  const navItems = (isAdminArea ? adminNavItems : userNavItems).filter(
    (item) => item && item.href && typeof item.href === 'string'
  )
  
  const getSectionKey = (href: string) => {
    return href.replace('/', '').replace(/-/g, '')
  }

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const sections: Record<string, boolean> = {}
    navItems.forEach(item => {
      if ('hasSubmenu' in item && item.hasSubmenu) {
        sections[getSectionKey(item.href)] = pathname?.startsWith(item.href) || false
      }
    })
    return sections
  })

  const handleNavigate = () => {
    onNavigate?.()
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Verificar se está sendo usado no mobile menu (quando className contém flex sem hidden)
  const isMobileMenu = className?.includes('flex') && !className?.includes('md:flex') && !className?.includes('hidden')
  
  return (
    <aside 
      className={cn(
        isMobileMenu 
          ? "flex flex-col w-full border-0 bg-transparent" 
          : "hidden md:flex flex-col w-64 border-r bg-background",
        className
      )}
      style={isMobileMenu ? { 
        display: 'flex !important',
        flexDirection: 'column',
        width: '100%',
        visibility: 'visible',
        opacity: 1,
        position: 'relative' as const,
        zIndex: 1,
        overflow: 'visible',
        height: 'auto',
        minHeight: 'auto',
        backgroundColor: 'transparent'
      } : undefined}
    >
      <div className={cn("flex-1 p-2 md:p-4 space-y-1", isMobileMenu ? "overflow-visible" : "overflow-y-auto")}>
        {navItems
          .filter((item) => {
            // Verificação rigorosa
            if (!item) return false
            if (!item.href) return false
            if (typeof item.href !== 'string') return false
            if (item.href.trim() === '') return false
            return true
          })
          .map((item, index) => {
          // Verificação dupla antes de usar
          if (!item.href || typeof item.href !== 'string') {
            return null
          }
          
          const Icon = item.icon
          const hasSubmenu = 'hasSubmenu' in item && item.hasSubmenu
          const sectionKey = getSectionKey(item.href)
          const isExpanded = expandedSections[sectionKey] || false
          const isActive = pathname === item.href || (hasSubmenu && pathname?.startsWith(item.href))
          
          if (hasSubmenu && 'submenu' in item && item.submenu) {
            const submenuItems = Array.isArray(item.submenu) ? item.submenu : []
            return (
              <div key={item.href} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className={cn(
                    "w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg transition-all relative group text-sm md:text-base",
                    isActive
                      ? "bg-[#ff5a1f] text-white font-semibold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />}
                  <span className="text-sm md:text-base flex-1 text-left truncate">{item.label || ''}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {isExpanded && submenuItems.length > 0 && (
                  <div className="ml-2 md:ml-4 space-y-1 pl-2 md:pl-4 border-l-2 border-border mt-1">
                    {submenuItems
                      .filter((subItem) => {
                        if (!subItem) return false
                        if (!subItem.href) return false
                        if (typeof subItem.href !== 'string') return false
                        if (subItem.href.trim() === '') return false
                        return true
                      })
                      .map((subItem, subIndex) => {
                      // Verificação dupla
                      if (!subItem.href || typeof subItem.href !== 'string') {
                        return null
                      }
                      
                      const SubIcon = subItem.icon
                      const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href + "/")
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-all text-xs md:text-sm",
                            isSubActive
                              ? "bg-[#ff5a1f]/20 text-[#ff5a1f] font-medium"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                          onClick={handleNavigate}
                        >
                          {SubIcon && <SubIcon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />}
                          <span className="truncate">{subItem.label || ''}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          
          // Verificação final antes de renderizar Link
          if (!item.href || typeof item.href !== 'string') {
            return null
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg transition-all relative group text-sm md:text-base",
                isActive
                  ? "bg-[#ff5a1f] text-white font-semibold"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={handleNavigate}
            >
              {Icon && <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />}
              <span className="text-sm md:text-base truncate">{item.label || ''}</span>
            </Link>
          )
        })}
      </div>

    </aside>
  )
}
