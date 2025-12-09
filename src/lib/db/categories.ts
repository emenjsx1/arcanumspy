import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

// OTIMIZAÇÃO: Cache mais agressivo (15 minutos) + localStorage
let categoriesCache: { data: Category[]; timestamp: number } | null = null
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutos (categorias mudam raramente)
const CACHE_KEY = 'categories_cache'
const CACHE_TIMESTAMP_KEY = 'categories_cache_timestamp'

// CORREÇÃO: Carregar cache do localStorage apenas quando necessário (não no nível do módulo)
// Isso evita problemas de SSR e hydration errors
function loadCacheFromStorage() {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (cached && timestamp) {
      const parsedTimestamp = parseInt(timestamp, 10)
      if (Date.now() - parsedTimestamp < CACHE_DURATION) {
        return {
          data: JSON.parse(cached),
          timestamp: parsedTimestamp
        }
      }
    }
  } catch (e) {
    // Ignorar erros de parse
  }
  return null
}

export async function getAllCategories(): Promise<Category[]> {
  // CORREÇÃO CRÍTICA: Garantir que nunca executa durante SSR/build
  // Esta função só deve ser chamada no cliente, mas adicionamos proteção extra
  if (typeof window === 'undefined') {
    console.warn('⚠️ [getAllCategories] Tentativa de execução durante SSR - retornando array vazio')
    return []
  }

  // OTIMIZAÇÃO: Verificar cache em memória primeiro
  if (categoriesCache && Date.now() - categoriesCache.timestamp < CACHE_DURATION) {
    return categoriesCache.data
  }
  
  // CORREÇÃO: Carregar do localStorage apenas quando necessário (não no nível do módulo)
  const storageCache = loadCacheFromStorage()
  if (storageCache) {
    // Atualizar cache em memória
    categoriesCache = storageCache
    return storageCache.data
  }
  
  // Se não tem cache válido, buscar do banco
  try {
    const timeout = 3000 // Reduzir timeout para 3s
    const query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
      .limit(100)
    
    const { data, error } = await Promise.race([
      query,
      new Promise<{ data: null; error: { message: string } }>(resolve => 
        setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), timeout)
      )
    ])

    if (error) {
      if (error.message === 'Timeout') {
        // Retornar cache antigo se disponível
        return categoriesCache?.data || []
      }
      // Em caso de erro, retornar cache se disponível
      return categoriesCache?.data || []
    }

    // Atualizar cache em memória e localStorage
    const timestamp = Date.now()
    categoriesCache = {
      data: data || [],
      timestamp
    }
    
    // Salvar no localStorage para persistir entre sessões
    // Já verificamos window acima, mas verificamos novamente por segurança
    if (typeof window !== 'undefined' && data) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())
      } catch (e) {
        // Ignorar erros de localStorage (pode estar cheio)
      }
    }

    return data || []
  } catch (error: any) {
    // Em caso de erro, retornar cache se disponível
    return categoriesCache?.data || []
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

export async function getCategoryStats(categoryId: string) {
  try {
    const { count, error } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('is_active', true)

    if (error) throw error

    return { offerCount: count || 0 }
  } catch (error) {
    console.error('Error fetching category stats:', error)
    return { offerCount: 0 }
  }
}

