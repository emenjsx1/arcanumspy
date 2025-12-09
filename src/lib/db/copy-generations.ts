import { supabase } from '@/lib/supabase/client'

export interface CopyGeneration {
  id: string
  user_id: string
  nicho: string
  tipo_criativo: string
  modelo: string
  publico: string
  promessa: string
  prova: string | null
  diferencial: string
  cta: string
  resultado: {
    copy_principal: string
    variacoes: string[]
    headlines: string[]
    descricao_curta: string
    legenda_anuncio: string
    script_ugc?: string
  }
  created_at: string
}

export interface CreateCopyGenerationInput {
  nicho: string
  tipo_criativo: string
  modelo: string
  publico: string
  promessa: string
  prova?: string
  diferencial: string
  cta: string
  resultado: {
    copy_principal: string
    variacoes: string[]
    headlines: string[]
    descricao_curta: string
    legenda_anuncio: string
    script_ugc?: string
  }
}

export async function createCopyGeneration(input: CreateCopyGenerationInput): Promise<CopyGeneration | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('copy_generations')
      .insert({
        user_id: user.id,
        nicho: input.nicho,
        tipo_criativo: input.tipo_criativo,
        modelo: input.modelo,
        publico: input.publico,
        promessa: input.promessa,
        prova: input.prova || null,
        diferencial: input.diferencial,
        cta: input.cta,
        resultado: input.resultado,
      })
      .select()
      .single()

    if (error) throw error

    return data as CopyGeneration
  } catch (error) {
    console.error('Error creating copy generation:', error)
    return null
  }
}

export async function getCopyGenerations(limit = 50, offset = 0): Promise<CopyGeneration[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('copy_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return (data || []) as CopyGeneration[]
  } catch (error) {
    console.error('Error fetching copy generations:', error)
    return []
  }
}

export async function getCopyGenerationById(id: string): Promise<CopyGeneration | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('copy_generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return data as CopyGeneration
  } catch (error) {
    console.error('Error fetching copy generation:', error)
    return null
  }
}

export async function deleteCopyGeneration(id: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('copy_generations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting copy generation:', error)
    return false
  }
}












