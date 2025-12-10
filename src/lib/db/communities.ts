import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
// CORREÇÃO: Import dinâmico para evitar erro de build (next/headers não pode ser usado em Client Components)
// As funções de créditos serão importadas dinamicamente apenas quando necessário

type Community = Database['public']['Tables']['communities']['Row']
type CommunityInsert = Database['public']['Tables']['communities']['Insert']
type CommunityUpdate = Database['public']['Tables']['communities']['Update']

export interface CommunityWithStats extends Community {
  member_count?: number
  posts_count?: number
}

/**
 * Get active communities for user (with member count)
 */
export async function getActiveCommunitiesForUser(): Promise<CommunityWithStats[]> {
  try {
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (communitiesError) {
      // Se a tabela não existir, retornar array vazio (não quebrar)
      if (communitiesError.code === '42P01' || communitiesError.code === 'PGRST202' || 
          communitiesError.message?.includes('does not exist') ||
          communitiesError.message?.includes('schema cache')) {
        console.warn('⚠️ [getActiveCommunitiesForUser] Tabela communities não existe. Execute a migration 025_create_communities_tables.sql')
        return []
      }
      throw communitiesError
    }

    // Se não houver comunidades, retornar array vazio
    if (!communities || communities.length === 0) {
      return []
    }

    // Get member counts and posts counts for each community (com tratamento de erro individual)
    const communitiesWithStats = await Promise.all(
      communities.map(async (community: any) => {
        try {
          const [memberCountResult, postsCountResult] = await Promise.all([
            supabase
              .from('community_members')
              .select('*', { count: 'exact', head: true })
              .eq('community_id', community.id),
            supabase
              .from('community_posts')
              .select('*', { count: 'exact', head: true })
              .eq('community_id', community.id)
          ])

          // Se houver erro ao contar (tabela não existe), usar 0
          const memberCount = memberCountResult.error ? 0 : (memberCountResult.count || 0)
          const postsCount = postsCountResult.error ? 0 : (postsCountResult.count || 0)

          if (memberCountResult.error) {
            console.warn(`⚠️ [getActiveCommunitiesForUser] Erro ao contar membros:`, memberCountResult.error.message)
          }
          if (postsCountResult.error) {
            console.warn(`⚠️ [getActiveCommunitiesForUser] Erro ao contar posts:`, postsCountResult.error.message)
          }

          return {
            ...community,
            member_count: memberCount,
            posts_count: postsCount,
          } as CommunityWithStats
        } catch (memberError: any) {
          console.warn(`⚠️ [getActiveCommunitiesForUser] Erro ao processar comunidade ${community.id}:`, memberError.message)
          return {
            ...community,
            member_count: 0,
            posts_count: 0,
          } as CommunityWithStats
        }
      })
    )

    return communitiesWithStats
  } catch (error: any) {
    console.error('❌ [getActiveCommunitiesForUser] Erro ao buscar comunidades:', error)
    // Sempre retornar array vazio para não quebrar a página
    return []
  }
}

/**
 * User joins a community
 * NOTA: Sistema de créditos removido - usando planos/subscrição
 */
export async function joinCommunity(userId: string, communityId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se a comunidade existe
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('is_active')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      throw new Error('Comunidade não encontrada')
    }

    if (!community.is_active) {
      throw new Error('Esta comunidade não está ativa')
    }

    // Adicionar usuário à comunidade (ou atualizar se já for membro)
    const { error } = await supabase
      .from('community_members')
      .upsert({
        user_id: userId,
        community_id: communityId,
        joined_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,community_id'
      })

    if (error) {
      // If already a member, that's okay
      if (error.code === '23505') {
        return { success: true }
      }
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error joining community:', error)
    return {
      success: false,
      error: error.message || 'Erro ao entrar na comunidade'
    }
  }
}

/**
 * User leaves a community
 */
export async function leaveCommunity(userId: string, communityId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', userId)
      .eq('community_id', communityId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error leaving community:', error)
    throw error
  }
}

/**
 * Admin: Get all communities with stats
 */
export async function adminGetAllCommunitiesWithStats(): Promise<CommunityWithStats[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data: communities, error: communitiesError } = await adminClient
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false })

    if (communitiesError) throw communitiesError

    // Get member counts for each community
    const communitiesWithStats = await Promise.all(
      (communities || []).map(async (community: any) => {
        const { count } = await adminClient
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id)

        return {
          ...community,
          member_count: count || 0,
        } as CommunityWithStats
      })
    )

    return communitiesWithStats
  } catch (error) {
    console.error('Error fetching all communities:', error)
    return []
  }
}

/**
 * Admin: Create community
 */
export async function adminCreateCommunity(community: CommunityInsert): Promise<Community | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const insertData: CommunityInsert = {
      name: community.name,
      description: community.description ?? null,
      is_paid: community.is_paid ?? false,
      join_link: community.join_link,
      is_active: community.is_active ?? true,
      ...(community.id && { id: community.id }),
      ...(community.created_at && { created_at: community.created_at }),
    }

    const { data, error } = await (adminClient
      .from('communities') as any)
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    return data as Community
  } catch (error) {
    console.error('Error creating community:', error)
    throw error
  }
}

/**
 * Admin: Update community
 */
export async function adminUpdateCommunity(id: string, updates: CommunityUpdate): Promise<Community | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // Converter CommunityUpdate para o formato esperado pelo Supabase
    const updateData: Partial<Community> = {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.is_paid !== undefined && { is_paid: updates.is_paid }),
      ...(updates.join_link !== undefined && { join_link: updates.join_link }),
      ...(updates.is_active !== undefined && { is_active: updates.is_active }),
      ...(updates.created_at !== undefined && { created_at: updates.created_at }),
    }

    const { data, error } = await (adminClient
      .from('communities') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data as Community
  } catch (error) {
    console.error('Error updating community:', error)
    throw error
  }
}

/**
 * Admin: Delete community
 */
export async function adminDeleteCommunity(id: string): Promise<boolean> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // Delete members first (CASCADE should handle this, but being explicit)
    await adminClient
      .from('community_members')
      .delete()
      .eq('community_id', id)

    // Delete community
    const { error } = await adminClient
      .from('communities')
      .delete()
      .eq('id', id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting community:', error)
    throw error
  }
}

