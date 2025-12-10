import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Niche = Database['public']['Tables']['niches']['Row']
type NicheInsert = Database['public']['Tables']['niches']['Insert']
type NicheUpdate = Database['public']['Tables']['niches']['Update']

export interface NicheWithCategory extends Niche {
  category?: {
    id: string
    name: string
    slug: string
    emoji: string | null
  }
}

/**
 * Get all active niches
 */
export async function getAllNiches(): Promise<NicheWithCategory[]> {
  try {
    const { data, error } = await supabase
      .from('niches')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return (data || []) as NicheWithCategory[]
  } catch (error) {
    console.error('Error fetching niches:', error)
    return []
  }
}

/**
 * Get niches by category
 */
export async function getNichesByCategory(categoryId: string): Promise<NicheWithCategory[]> {
  try {
    const { data, error } = await supabase
      .from('niches')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return (data || []) as NicheWithCategory[]
  } catch (error) {
    console.error('Error fetching niches by category:', error)
    return []
  }
}

/**
 * Get niche by ID
 */
export async function getNicheById(id: string): Promise<NicheWithCategory | null> {
  try {
    const { data, error } = await supabase
      .from('niches')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return data as NicheWithCategory | null
  } catch (error) {
    console.error('Error fetching niche by ID:', error)
    return null
  }
}

/**
 * Admin: Get all niches (including inactive)
 */
export async function adminGetAllNiches(): Promise<NicheWithCategory[]> {
  try {
    const { data, error } = await supabase
      .from('niches')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []) as NicheWithCategory[]
  } catch (error) {
    console.error('Error fetching all niches:', error)
    return []
  }
}

/**
 * Admin: Create niche
 */
export async function adminCreateNiche(niche: NicheInsert): Promise<Niche | null> {
  try {
    const insertData: NicheInsert = {
      name: niche.name,
      slug: niche.slug,
      description: niche.description ?? null,
      category_id: niche.category_id,
      is_active: niche.is_active ?? true,
      ...(niche.id && { id: niche.id }),
      ...(niche.created_at && { created_at: niche.created_at }),
    }

    const { data, error } = await supabase
      .from('niches')
      .insert([insertData] as any)
      .select()
      .single()

    if (error) throw error

    return data as Niche
  } catch (error) {
    console.error('Error creating niche:', error)
    throw error
  }
}

/**
 * Admin: Update niche
 */
export async function adminUpdateNiche(id: string, updates: NicheUpdate): Promise<Niche | null> {
  try {
    // Converter NicheUpdate para o formato esperado pelo Supabase
    const updateData: Partial<Niche> = {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.slug !== undefined && { slug: updates.slug }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.category_id !== undefined && { category_id: updates.category_id }),
      ...(updates.is_active !== undefined && { is_active: updates.is_active }),
      ...(updates.created_at !== undefined && { created_at: updates.created_at }),
    }

    const { data, error } = await supabase
      .from('niches')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data as Niche
  } catch (error) {
    console.error('Error updating niche:', error)
    throw error
  }
}

/**
 * Admin: Delete niche
 */
export async function adminDeleteNiche(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('niches')
      .delete()
      .eq('id', id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting niche:', error)
    throw error
  }
}

