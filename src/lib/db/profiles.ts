import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// Variável para prevenir loops infinitos
let profileFetchInProgress = false
let lastProfileFetchTime = 0
const PROFILE_FETCH_COOLDOWN = 500 // Reduzido para 500ms (era 2 segundos)

export async function getCurrentUserProfile(force: boolean = false): Promise<Profile | null> {
  // Prevenir múltiplas chamadas simultâneas (mas permitir forçar)
  const now = Date.now()
  if (!force && (profileFetchInProgress || (now - lastProfileFetchTime) < PROFILE_FETCH_COOLDOWN)) {
    return null
  }

  profileFetchInProgress = true
  lastProfileFetchTime = now

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      profileFetchInProgress = false
      return null
    }

    // USAR APENAS RPC FUNCTION para evitar recursão infinita nas políticas RLS
    // A função ensure_profile() usa SECURITY DEFINER e bypassa RLS completamente
    try {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('ensure_profile')

      if (!functionError && functionResult) {
        profileFetchInProgress = false
        return functionResult as Profile
      }

      // Se a RPC falhar, tentar buscar diretamente como último recurso
      if (functionError) {
        console.warn('RPC ensure_profile failed, trying direct query:', functionError)
        
        // Tentar buscar diretamente apenas se a RPC falhar
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (!error && data) {
          profileFetchInProgress = false
          return data
        }

        // Se ainda falhar, retornar null
        profileFetchInProgress = false
        return null
      }
    } catch (rpcError: any) {
      console.error('RPC ensure_profile error:', rpcError)
      
      // Se a função RPC não existir, tentar buscar diretamente
      if (rpcError?.code === '42883' || rpcError?.message?.includes('does not exist')) {
        console.warn('RPC function does not exist, using direct query...')
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (!error && data) {
          profileFetchInProgress = false
          return data
        }
      }
      
      profileFetchInProgress = false
      return null
    }
    
    profileFetchInProgress = false
    return null

  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error)
    profileFetchInProgress = false
    return null
  }
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

