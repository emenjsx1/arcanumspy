-- ============================================
-- Tabela para armazenar histórico de criptografias de texto
-- ============================================

CREATE TABLE IF NOT EXISTS public.criptografias_texto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto_original TEXT,
  texto_criptografado TEXT NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('criptografar', 'descriptografar')),
  usar_criptografia BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_criptografias_texto_user_id ON public.criptografias_texto(user_id);
CREATE INDEX IF NOT EXISTS idx_criptografias_texto_created_at ON public.criptografias_texto(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.criptografias_texto ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own criptografias"
  ON public.criptografias_texto FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own criptografias"
  ON public.criptografias_texto FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own criptografias"
  ON public.criptografias_texto FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE public.criptografias_texto IS 'Histórico de criptografias e descriptografias de texto dos usuários';
COMMENT ON COLUMN public.criptografias_texto.usar_criptografia IS 'Indica se a criptografia Unicode foi usada ao salvar o texto';









