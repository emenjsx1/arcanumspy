import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUserProfile } from '@/lib/db/profiles'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// Lock para prevenir múltiplas chamadas simultâneas de refreshProfile
let refreshProfileInProgress = false

interface AuthState {
  user: (SupabaseUser & { profile?: Profile }) | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,

      initialize: async () => {
        const currentState = get()
        
        // CORREÇÃO: Flag global para evitar múltiplas inicializações simultâneas
        if (typeof window !== 'undefined' && (window as any).__authInitializing) {
          // Aguardar até que a inicialização atual termine
          let attempts = 0
          while ((window as any).__authInitializing && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }
          return
        }
        
        // CORREÇÃO: Verificar estado inconsistente (isAuthenticated: true mas user: null)
        if (currentState.isAuthenticated && !currentState.user) {
          // Estado inconsistente - resetar
          set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
        }
        
        // OTIMIZAÇÃO: Se já está inicializado corretamente, verificar se a sessão ainda é válida
        // Mas SEMPRE verificar a sessão do Supabase para garantir que está sincronizado
        if (currentState.user && currentState.profile && !currentState.isLoading && currentState.isAuthenticated) {
          // Verificar se a sessão ainda é válida (sem bloquear a UI)
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              // Sessão expirada - limpar estado
              set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
            }
          }).catch(() => {
            // Se houver erro, manter estado atual
          })
          return
        }
        
        // Se já está inicializando, não iniciar novamente
        if (currentState.isLoading) {
          return
        }

        // Marcar como inicializando
        if (typeof window !== 'undefined') {
          (window as any).__authInitializing = true
        }
        
        set({ isLoading: true })
        
        // CORREÇÃO: Timeout de segurança para garantir que isLoading nunca fique travado
        const safetyTimeout = setTimeout(() => {
          const currentState = get()
          if (currentState.isLoading) {
            console.warn('⚠️ [AuthStore] Timeout na inicialização - liberando isLoading')
            set({ isLoading: false })
          }
        }, 5000) // Aumentar para 5 segundos para dar mais tempo
        
        try {
          // SEMPRE verificar a sessão do Supabase (que persiste via cookies)
          // Isso garante que mesmo navegando entre páginas, a sessão seja recuperada
          const { data: { session }, error } = await supabase.auth.getSession()
          
          // Limpar timeout de segurança
          clearTimeout(safetyTimeout)
          
          if (error || !session) {
            // Sem sessão válida - limpar estado
            set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
            return
          }

          // Sessão encontrada - carregar perfil
          // OTIMIZAÇÃO: Carregar perfil em paralelo, mas não bloquear se demorar
          const profilePromise = getCurrentUserProfile()
          const profileTimeout = new Promise<null>((resolve) => 
            setTimeout(() => resolve(null), 3000)
          )
          
          const profile = await Promise.race([profilePromise, profileTimeout])
          
          // Atualizar estado com sessão e perfil
          set({
            user: session.user,
            profile: profile,
            isAuthenticated: true,
            isLoading: false,
          })

          // Listen to auth changes (apenas uma vez - o listener persiste)
          // Usar flag global para garantir que só inicializa uma vez
          if (typeof window !== 'undefined' && !(window as any).__authListenerInitialized) {
            (window as any).__authListenerInitialized = true
            supabase.auth.onAuthStateChange(async (event, session) => {
              try {
                if (event === 'SIGNED_IN' && session) {
                  const profile = await getCurrentUserProfile()
                  set({
                    user: session.user,
                    profile: profile,
                    isAuthenticated: true,
                  })
                } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                  // Se foi deslogado ou token expirado, limpar estado
                  if (event === 'SIGNED_OUT') {
                    set({
                      user: null,
                      profile: null,
                      isAuthenticated: false,
                    })
                  } else if (event === 'TOKEN_REFRESHED' && session) {
                    // Token foi renovado - atualizar usuário se necessário
                    const profile = await getCurrentUserProfile()
                    set({
                      user: session.user,
                      profile: profile,
                      isAuthenticated: true,
                    })
                  }
                }
              } catch (error) {
                console.error('Error in auth state change:', error)
              }
            })
          }
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
        } finally {
          // CORREÇÃO: Sempre limpar flag de inicialização e garantir que isLoading seja false
          if (typeof window !== 'undefined') {
            (window as any).__authInitializing = false
          }
          // Garantir que isLoading seja sempre false no finally
          const finalState = get()
          if (finalState.isLoading) {
            set({ isLoading: false })
          }
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          if (data.user && data.session) {
            // Aguardar um pouco para garantir que o perfil está disponível
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Primeiro, garantir que o perfil existe
            try {
              const ensureResponse = await fetch('/api/profile/ensure', {
                method: 'POST',
                credentials: 'include',
              })
              
              if (ensureResponse.ok) {
                const ensureData = await ensureResponse.json()
              }
            } catch (ensureError) {
              console.error('Error ensuring profile:', ensureError)
            }
            
            // Aguardar mais um pouco após garantir
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Get profile - tentar múltiplas vezes se necessário
            let profile = await getCurrentUserProfile()
            
            // Se não encontrou, tentar novamente
            if (!profile) {
              await new Promise(resolve => setTimeout(resolve, 500))
              profile = await getCurrentUserProfile()
            }
            
            
            set({
              user: data.user,
              profile: profile,
              isAuthenticated: true,
              isLoading: false,
            })
          }
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true })
        try {
          // 1. Criar usuário no Supabase Auth
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name,
              },
            },
          })

          if (error) throw error

          if (!data.user) {
            throw new Error('Signup não retornou usuário')
          }

          // 2. Criar perfil e créditos manualmente (não depende mais dos triggers)
          const displayName = name || data.user.user_metadata?.name || email.split('@')[0] || 'User'
          const role: 'admin' | 'user' = email === 'emenmurromua@gmail.com' ? 'admin' : 'user'

          // Criar perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              name: displayName,
              email: email,
              role: role,
            })

          // IMPORTANTE: Se houver erro ao criar perfil, não quebrar o signup
          // O usuário já foi criado no auth, então o signup foi bem-sucedido
          if (profileError) {
            console.error('⚠️ Erro ao criar perfil (signup continuou):', profileError.message)
            // Tentar criar via API como fallback
            try {
              await fetch('/api/profile/ensure', {
                method: 'POST',
                credentials: 'include',
              })
            } catch (apiError) {
              console.error('⚠️ Erro ao criar perfil via API:', apiError)
            }
          }

          // Criar registro de créditos (se não existir)
          try {
            const { error: creditsError } = await supabase
              .from('user_credits')
              .insert({
                user_id: data.user.id,
                balance: 0,
                total_loaded: 0,
                total_consumed: 0,
              })
              .select()
              .single()

            if (creditsError && creditsError.code !== '23505') { // Ignorar erro de duplicata
              console.warn('⚠️ Erro ao criar créditos (não crítico):', creditsError.message)
            }
          } catch (creditsErr) {
            console.warn('⚠️ Erro ao criar créditos (não crítico):', creditsErr)
          }

          // 3. Buscar perfil criado
          await new Promise(resolve => setTimeout(resolve, 500))
          const profile = await getCurrentUserProfile()
          
          // 4. Enviar email de boas-vindas (não bloqueia o signup se falhar)
          try {
            // Obter token da sessão atual
            const { data: { session } } = await supabase.auth.getSession()
            await fetch('/api/email/welcome', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
              },
              credentials: 'include',
              body: JSON.stringify({
                name: displayName,
                email: email,
              }),
            })
          } catch (emailError) {
            console.warn('⚠️ Erro ao enviar email de boas-vindas (não crítico):', emailError)
          }
          
          set({
            user: data.user,
            profile: profile,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut()
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
          })
        } catch (error) {
          console.error('Error logging out:', error)
        }
      },

      refreshProfile: async () => {
        // CORREÇÃO: Verificar se está no cliente antes de acessar window
        if (typeof window === 'undefined') {
          return
        }
        
        // OTIMIZAÇÃO: Prevenir múltiplas chamadas simultâneas com cooldown
        const currentState = get()
        const now = Date.now()
        
        // Usar Map global para armazenar flags de refresh (não no estado do Zustand)
        const lastRefresh = (window as any).__lastProfileRefresh || 0
        const REFRESH_COOLDOWN = 3000 // 3 segundos de cooldown

        if (now - lastRefresh < REFRESH_COOLDOWN) {
          return
        }

        // Marcar como em refresh
        if ((window as any).__refreshingProfile) {
          return
        }

        (window as any).__refreshingProfile = true
        ;(window as any).__lastProfileRefresh = now

        // Verificar se já tem perfil carregado
        if (currentState.profile && !currentState.isLoading) {
          // Já tem perfil e não está carregando, não precisa recarregar
          (window as any).__refreshingProfile = false
          return
        }

        
        try {
          // Limpar perfil atual primeiro
          set({ profile: null })
          
          // Aguardar um pouco para garantir que o estado foi limpo
          await new Promise(resolve => setTimeout(resolve, 100))
        
          // Primeiro, garantir que o perfil existe
          try {
            // Get session token
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session) {
              return
            }
            
            const headers: HeadersInit = {
              'Content-Type': 'application/json',
            }
            
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`
            }
            
            const response = await fetch('/api/profile/ensure', {
              method: 'POST',
              credentials: 'include',
              cache: 'no-store',
              headers,
            })
            
            if (response.ok) {
              const data = await response.json()
              
              // Se a API retornou o perfil, usar ele
              if (data.profile) {
                set({ profile: data.profile })
                return
              }
            } else {
              console.error('❌ [AuthStore] Erro ao garantir perfil:', response.status, response.statusText)
            }
          } catch (error) {
            console.error('❌ [AuthStore] Erro ao garantir perfil:', error)
          }
          
          // Depois, carregar o perfil diretamente (forçar para ignorar cooldown)
          const profile = await getCurrentUserProfile(true) // Forçar carregamento
          
          if (profile) {
            set({ profile })
          } else {
            // Se ainda não carregou, tentar mais uma vez após delay
            await new Promise(resolve => setTimeout(resolve, 500))
            const retryProfile = await getCurrentUserProfile(true) // Forçar novamente
            if (retryProfile) {
              set({ profile: retryProfile })
            } else {
              console.error('❌ [AuthStore] Falha ao carregar perfil após múltiplas tentativas')
            }
          }
        } catch (error) {
          console.error('❌ [AuthStore] Erro ao fazer refresh do perfil:', error)
        } finally {
          // Limpar flag de refresh
          ;(window as any).__refreshingProfile = false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // CORREÇÃO: Não persistir isAuthenticated sozinho para evitar estado inconsistente
        // A sessão é gerenciada pelo Supabase via cookies, não precisamos persistir estado de auth
        // Isso evita problemas quando usuário volta e tem isAuthenticated: true mas user: null
      }),
      // Adicionar função de rehydrate para validar estado ao restaurar
      onRehydrateStorage: () => (state) => {
        // Validar estado ao restaurar - se inconsistente, resetar
        if (state && state.isAuthenticated && !state.user) {
          return {
            ...state,
            isAuthenticated: false,
            user: null,
            profile: null,
            isLoading: false
          }
        }
        return state
      },
    }
  )
)
