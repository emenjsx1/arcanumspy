import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Subscription = Database['public']['Tables']['subscriptions']['Row']
type Plan = Database['public']['Tables']['plans']['Row']

export interface UserWithSubscription extends Omit<Profile, 'email'> {
  email?: string | null // Email from auth.users (pode ser diferente do Profile)
  subscription?: Subscription & { plan?: Plan }
}

export interface UserFullInfoForAdmin {
  id: string
  name: string
  phone_number: string | null
  email: string | null
  role: string
  plan?: {
    name: string
    slug: string
  }
  subscription_status?: string
  created_at: string
}

export async function getAllUsers(): Promise<UserWithSubscription[]> {
  const startTime = Date.now()
  
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // Buscar todos os perfis (sem limite)
    const { data: profilesRaw, error } = await (adminClient
      .from('profiles') as any)
      .select(`
        *,
        subscriptions(
          *,
          plan:plans(*)
        )
      `)
      .order('created_at', { ascending: false })
    
    const profiles = (profilesRaw || []) as any[]

    if (error) {
      // Se houver erro com subscriptions, tentar sem elas
      if (error.message?.includes('subscriptions') || error.message?.includes('relation')) {
        console.warn('⚠️ [Admin All Users] Erro com subscriptions, tentando sem elas...')
        const { data: fallbackProfiles, error: fallbackError } = await adminClient
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (fallbackError) throw fallbackError

        // Buscar emails de todos os usuários em paralelo
        const profilesArray: any[] = Array.isArray(fallbackProfiles) ? fallbackProfiles : []
        const usersWithEmail = await Promise.all(
          profilesArray.map(async (profile: any) => {
            try {
              const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id)
              return {
                ...profile,
                email: authUser?.user?.email || null,
                subscription: undefined,
              } as UserWithSubscription
            } catch (emailError) {
              console.warn(`⚠️ [Admin All Users] Erro ao buscar email para usuário ${profile.id}:`, emailError)
              return {
                ...profile,
                email: null,
                subscription: undefined,
              } as UserWithSubscription
            }
          })
        )

        const totalTime = Date.now() - startTime
        return usersWithEmail
      }
      throw error
    }

    // Buscar emails de todos os usuários em paralelo
    const profilesArray: any[] = Array.isArray(profiles) ? profiles : []
    const usersWithEmail = await Promise.all(
      profilesArray.map(async (profile: any) => {
        try {
          const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id)
          return {
            ...profile,
            email: authUser?.user?.email || null,
          } as UserWithSubscription
        } catch (emailError) {
          console.warn(`⚠️ [Admin All Users] Erro ao buscar email para usuário ${profile.id}:`, emailError)
          return {
            ...profile,
            email: null,
          } as UserWithSubscription
        }
      })
    )

    const totalTime = Date.now() - startTime

    return usersWithEmail
  } catch (error) {
    console.error('❌ [Admin All Users] Erro ao buscar usuários:', error)
    return []
  }
}

export async function getRecentUsers(limit = 10): Promise<UserWithSubscription[]> {
  const startTime = Date.now()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.warn('⚠️ [Admin Recent Users] Sem sessão')
      return []
    }

    const response = await fetch(`/api/admin/users?limit=${limit}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const users = (data.users || []).slice(0, limit) as UserWithSubscription[]

    const totalTime = Date.now() - startTime

    return users
  } catch (error) {
    console.error('❌ [Admin Recent Users] Erro ao buscar usuários:', error)
    return []
  }
}

/**
 * Get full user info for admin (with name, phone_number, plan, status)
 */
export async function getUserFullInfoForAdmin(userId: string): Promise<UserFullInfoForAdmin | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // Get profile with subscription
    const { data: profileRaw, error: profileError } = await (adminClient
      .from('profiles') as any)
      .select(`
        id,
        name,
        phone_number,
        role,
        created_at,
        subscriptions(
          status,
          plan:plans(name, slug)
        )
      `)
      .eq('id', userId)
      .single()

    if (profileError) throw profileError
    if (!profileRaw) return null

    const profile = profileRaw as any

    // Get email from auth.users
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId)
    const email = authUser?.user?.email || null

    const subscription = profile.subscriptions?.[0] || profile.subscription
    const plan = subscription?.plan

    return {
      id: profile.id,
      name: profile.name,
      phone_number: profile.phone_number,
      email,
      role: profile.role,
      plan: plan ? { name: plan.name, slug: plan.slug } : undefined,
      subscription_status: subscription?.status,
      created_at: profile.created_at,
    }
  } catch (error) {
    console.error('Error fetching user full info:', error)
    return null
  }
}
