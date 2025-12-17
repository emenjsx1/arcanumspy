-- ============================================
-- ADD LANGUAGE COLUMN TO OFFERS
-- Migration 050: Adicionar campo de idioma na tabela offers
-- ============================================

-- Adicionar coluna language se não existir
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS language TEXT;

-- Comentário
COMMENT ON COLUMN offers.language IS 'Idioma da oferta (pt, en, es, etc.)';

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_offers_language ON offers(language);









