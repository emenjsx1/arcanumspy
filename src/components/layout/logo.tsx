"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  href?: string
  showText?: boolean
  variant?: "default" | "with-bg" // Variante para sidebar (com fundo) ou header (sem fundo)
}

export function Logo({ className, href = "/", showText = true, variant = "default" }: LogoProps) {
  // Garantir que href sempre seja uma string válida
  const validHref = href && typeof href === 'string' ? href : "/"
  
  const logoContent = (
    <div className={cn("flex items-center space-x-2 group", className)}>
      {/* Logo com triângulo */}
      <div className="relative flex-shrink-0">
        {variant === "with-bg" ? (
          // Variante com fundo (para sidebar)
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
          >
            {/* Fundo com gradiente */}
            <rect width="32" height="32" rx="6" fill="url(#logoGradient)"/>
            <defs>
              <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary) / 0.8)" />
              </linearGradient>
            </defs>
            {/* Triângulo Play */}
            <path 
              d="M12 10L22 16L12 22V10Z" 
              fill="white"
              className="group-hover:fill-white/90 transition-colors"
            />
          </svg>
        ) : (
          // Variante sem fundo (para header)
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
          >
            {/* Triângulo Play - apenas o triângulo, sem fundo */}
            <path 
              d="M8 5V19L19 12L8 5Z" 
              fill="currentColor"
              className="text-primary group-hover:text-primary/80 transition-colors"
            />
          </svg>
        )}
      </div>
      {showText && (
        <span className="font-bold text-lg tracking-tight">
          Arcanum<span className="text-primary">Spy</span>
        </span>
      )}
    </div>
  )
  
  if (!validHref) {
    return logoContent
  }
  
  return (
    <Link href={validHref} className="flex items-center hover:opacity-80 transition-opacity">
      {logoContent}
    </Link>
  )
}

