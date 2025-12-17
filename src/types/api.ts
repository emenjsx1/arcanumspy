/**
 * Tipos de API baseados no Database do Supabase
 * 
 * Estes tipos garantem type-safety em todas as rotas API,
 * eliminando a necessidade de usar 'any' e prevenindo erros de inferência 'never'
 */

import { Database } from './database'

// ============================================================================
// OFFERS
// ============================================================================

export type OfferRow = Database['public']['Tables']['offers']['Row']
export type OfferInsert = Database['public']['Tables']['offers']['Insert']
export type OfferUpdate = Database['public']['Tables']['offers']['Update']

export type OfferWithCategory = OfferRow & {
  category: {
    id: string
    name: string
    slug: string
    emoji: string | null
  } | null
}

export type OfferWithRelations = OfferWithCategory & {
  niche: {
    id: string
    name: string
    slug: string
  } | null
}

// ============================================================================
// PLANS
// ============================================================================

export type PlanRow = Database['public']['Tables']['plans']['Row']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']
export type PlanUpdate = Database['public']['Tables']['plans']['Update']

// ============================================================================
// PROFILES
// ============================================================================

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// ============================================================================
// CATEGORIES
// ============================================================================

export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

// ============================================================================
// NICHES
// ============================================================================

export type NicheRow = Database['public']['Tables']['niches']['Row']
export type NicheInsert = Database['public']['Tables']['niches']['Insert']
export type NicheUpdate = Database['public']['Tables']['niches']['Update']

// ============================================================================
// USERS (via Supabase Auth)
// ============================================================================

export type User = {
  id: string
  email?: string | null
  user_metadata?: Record<string, any>
  created_at?: string
}

// ============================================================================
// RESPONSES API PADRÃO
// ============================================================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: string
  code?: string
}

export interface ApiListResponse<T> {
  items: T[]
  count?: number
  page?: number
  pageSize?: number
}







