/**
 * Dynamic imports para componentes pesados
 * Reduz o bundle inicial e melhora o tempo de carregamento
 */

import dynamic from 'next/dynamic'

// Framer Motion - carregar apenas quando necessário
export const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
)

export const MotionSection = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.section),
  { ssr: false }
)

export const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => mod.AnimatePresence),
  { ssr: false }
)

// Componentes admin pesados (carregar sob demanda)
export const AdminDashboard = dynamic(
  () => import('@/app/(admin)/admin/dashboard/page'),
  { 
    ssr: false
  }
)

// Componentes de voz pesados
export const VoicesPage = dynamic(
  () => import('@/app/(auth)/voices/page'),
  { 
    ssr: false 
  }
)

