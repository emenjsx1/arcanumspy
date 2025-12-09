/**
 * Função reutilizável para verificar autenticação
 * Funciona tanto no backend quanto no frontend
 */

import { createClient } from '@/lib/supabase/server'
import { supabase } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

/**
 * Verifica autenticação no servidor (middleware/API routes)
 */
export async function isAuthenticatedServer(request?: Request): Promise<boolean> {
  try {
    const supabaseClient = await createClient()
    const { data: { user }, error } = await supabaseClient.auth.getUser()
    
    if (error || !user) {
      // Tentar via header Authorization se fornecido
      if (request) {
        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          const { data: { user: tokenUser } } = await supabaseClient.auth.getUser(token)
          return !!tokenUser
        }
      }
      return false
    }
    
    return !!user
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Verifica autenticação no cliente (React components)
 */
export async function isAuthenticatedClient(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return !error && !!session?.user
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Função unificada que detecta automaticamente o ambiente
 */
export async function isAuthenticated(request?: Request): Promise<boolean> {
  // Se estamos no servidor (tem request ou cookies disponível)
  if (typeof window === 'undefined') {
    return await isAuthenticatedServer(request)
  }
  
  // Se estamos no cliente
  return await isAuthenticatedClient()
}

/**
 * Função helper para obter usuário autenticado em API routes
 * Tenta cookies primeiro, depois header Authorization
 */
export async function getAuthenticatedUser(request?: Request): Promise<{ user: any | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar via cookies, tentar via header Authorization
    if (authError || !user) {
      if (request) {
        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
          const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          })
          const { data: { user: userFromToken }, error: tokenError } = await tempClient.auth.getUser(token)
          if (userFromToken && !tokenError) {
            user = userFromToken
            authError = null
          } else if (tokenError) {
            authError = tokenError
          }
        }
      }
    }
    
    return { user: user || null, error: authError || null }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return { user: null, error: error as Error }
  }
}




