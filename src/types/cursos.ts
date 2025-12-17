export interface Curso {
  id: string
  nome: string
  descricao: string | null
  imagem_url: string | null
  ordem: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Modulo {
  id: string
  curso_id: string
  nome: string
  descricao: string | null
  ordem: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Aula {
  id: string
  modulo_id: string
  titulo: string
  descricao: string | null
  video_url: string
  duracao_minutos: number | null
  ordem: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CursoWithModulos extends Curso {
  modulos?: ModuloWithAulas[]
}

export interface ModuloWithAulas extends Modulo {
  aulas?: Aula[]
}

export interface CreateCursoInput {
  nome: string
  descricao?: string
  imagem_url?: string
  ordem?: number
  is_active?: boolean
}

export interface UpdateCursoInput {
  nome?: string
  descricao?: string
  imagem_url?: string
  ordem?: number
  is_active?: boolean
}

export interface CreateModuloInput {
  curso_id: string
  nome: string
  descricao?: string
  ordem?: number
  is_active?: boolean
}

export interface UpdateModuloInput {
  nome?: string
  descricao?: string
  ordem?: number
  is_active?: boolean
}

export interface CreateAulaInput {
  modulo_id: string
  titulo: string
  descricao?: string
  video_url: string
  duracao_minutos?: number
  ordem?: number
  is_active?: boolean
}

export interface UpdateAulaInput {
  titulo?: string
  descricao?: string
  video_url?: string
  duracao_minutos?: number
  ordem?: number
  is_active?: boolean
}











