import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Read environment variables directly
// In Next.js, NEXT_PUBLIC_* variables are injected at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a function to get the client
function getSupabaseClient() {
  // Check if variables are available
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
    // In development, show helpful error message
    if (typeof window !== 'undefined') {
      if (isDevelopment) {
        console.error('⚠️ Missing Supabase environment variables!')
        console.error('📝 Please create a .env.local file in the root directory with:')
        console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
        console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
        console.error('   Get these from: https://app.supabase.com/project/_/settings/api')
        console.error('   See ENV_SETUP.md for detailed instructions')
        console.error('   ⚠️ IMPORTANT: Restart the dev server after creating .env.local!')
      } else if (isProduction) {
        console.error('❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!')
        console.error('📝 Configure as seguintes variáveis no Vercel:')
        console.error('   1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables')
        console.error('   2. Adicione: NEXT_PUBLIC_SUPABASE_URL')
        console.error('   3. Adicione: NEXT_PUBLIC_SUPABASE_ANON_KEY')
        console.error('   4. Faça um novo deploy após configurar')
        console.error('   Veja CONFIGURAR_VERCEL.md para instruções detalhadas')
      }
      console.error('   Current values:', { 
        url: supabaseUrl || 'NOT SET', 
        key: supabaseAnonKey ? 'SET (hidden)' : 'NOT SET',
        env: process.env.NODE_ENV
      })
    }
    
    // Em produção, lançar erro em vez de retornar placeholder
    if (isProduction && typeof window !== 'undefined') {
      // Mostrar erro amigável para o usuário
      throw new Error('Configuração do servidor incompleta. Por favor, entre em contato com o suporte.')
    }
    
    // Return a placeholder client that will fail gracefully (apenas em desenvolvimento)
    // Use 'any' type to avoid TypeScript inference issues
    return createClient<any>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }) as any
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = getSupabaseClient()

