-- ============================================
-- ADD IMAGE_URL TO OFFERS TABLE
-- Migration 056: Adicionar campo de imagem às ofertas
-- ============================================

-- Adicionar coluna image_url à tabela offers
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Criar índice para melhor performance em queries que filtram por imagem
CREATE INDEX IF NOT EXISTS idx_offers_image_url ON offers(image_url) WHERE image_url IS NOT NULL;

-- Comentário
COMMENT ON COLUMN offers.image_url IS 'URL da imagem da oferta (armazenada no Supabase Storage)';







