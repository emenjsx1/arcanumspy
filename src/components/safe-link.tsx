"use client"

import Link from "next/link"
import { ReactNode } from "react"

interface SafeLinkProps {
  href: string | undefined | null
  children: ReactNode
  className?: string
  onClick?: () => void
  [key: string]: any
}

export function SafeLink({ href, children, ...props }: SafeLinkProps) {
  // Se href não for válido, renderizar como span
  if (!href || typeof href !== 'string' || href.trim() === '') {
    return (
      <span {...props} style={{ cursor: 'not-allowed', opacity: 0.5 }}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

