/**
 * Tipos básicos para schemas do Supabase
 */

export type ProfileBasic = {
  id: string
  name: string | null
}

export type UserBasic = {
  id: string
  email?: string | null
  name?: string | null
}

export type OfferBasic = {
  id: string
  title?: string | null
  short_description?: string | null
  category_id?: string
  niche_id?: string | null
  country?: string
  funnel_type?: string
  temperature?: string
  main_url?: string
  facebook_ads_url?: string | null
  vsl_url?: string | null
  drive_copy_url?: string | null
  drive_creatives_url?: string | null
  quiz_url?: string | null
  is_active?: boolean
  image_url?: string | null
  [key: string]: any // Para campos opcionais adicionais
}







