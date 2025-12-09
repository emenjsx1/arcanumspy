-- ============================================
-- ADICIONAR CAMPO COR NAS ANOTAÇÕES
-- ============================================

-- Adicionar coluna cor na tabela anotacoes
ALTER TABLE anotacoes 
ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT '#3b82f6';

-- Criar índice para busca por cor (opcional)
CREATE INDEX IF NOT EXISTS idx_anotacoes_cor ON anotacoes(cor);


