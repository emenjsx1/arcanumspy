import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { OfferWithCategory } from './offers'

type Favorite = Database['public']['Tables']['favorites']['Row']

export interface FavoriteWithOffer extends Favorite {
  offer: OfferWithCategory
}

export async function getUserFavorites(): Promise<FavoriteWithOffer[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        offer:offers(
          *,
          category:categories(id, name, slug, emoji)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []) as FavoriteWithOffer[]
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return []
  }
}

export async function toggleFavorite(offerId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if already favorited
    const { data: existingList, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('offer_id', offerId)
      .limit(1)

    // Se houver erro mas não for "não encontrado", lançar erro
    if (checkError && checkError.code !== 'PGRST116') {
      // Se for erro 406 ou 500, pode ser problema de RLS ou tabela, tentar continuar
      if (checkError.code === 'PGRST301' || checkError.code === 'PGRST202') {
        console.warn('⚠️ [toggleFavorite] Erro ao verificar favorito, assumindo que não existe:', checkError.message)
      } else {
        throw checkError
      }
    }

    const existing = existingList && existingList.length > 0 ? existingList[0] : null

    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('offer_id', offerId)

      if (error) throw error
      return false
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          offer_id: offerId,
        })

      if (error) throw error
      return true
    }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    throw error
  }
}

export async function isFavorite(offerId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('offer_id', offerId)
      .limit(1)

    // Se houver erro mas não for "não encontrado", retornar false
    if (error) {
      // PGRST116 = nenhum resultado encontrado (não é erro)
      // PGRST301 = erro de RLS/permissão
      // PGRST202 = tabela não encontrada
      if (error.code === 'PGRST116') {
        return false
      }
      // Para outros erros, logar e retornar false (não bloquear)
      if (error.code !== 'PGRST301' && error.code !== 'PGRST202') {
        console.warn('⚠️ [isFavorite] Erro ao verificar favorito:', error.message)
      }
      return false
    }

    return !!(data && data.length > 0)
  } catch (error) {
    console.error('Error checking favorite:', error)
    return false
  }
}

export async function updateFavoriteNotes(offerId: string, notes: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('favorites')
      .update({ personal_notes: notes })
      .eq('user_id', user.id)
      .eq('offer_id', offerId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating favorite notes:', error)
    throw error
  }
}

