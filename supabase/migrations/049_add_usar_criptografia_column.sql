-- ============================================
-- Adicionar coluna usar_criptografia na tabela criptografias_texto
-- ============================================

-- Adicionar coluna usar_criptografia se não existir
ALTER TABLE public.criptografias_texto
ADD COLUMN IF NOT EXISTS usar_criptografia BOOLEAN DEFAULT false;

-- Comentário na coluna
COMMENT ON COLUMN public.criptografias_texto.usar_criptografia IS 'Indica se a criptografia Unicode foi usada ao salvar o texto';









