-- ============================================
-- ADD SCALED_AT AND EXPIRES_AT TO OFFERS
-- Migration 031: Adicionar campos para rastrear ofertas escalando e expiração
-- ============================================

-- Adicionar coluna scaled_at (timestamp quando a oferta foi marcada como escalando)
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS scaled_at TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna expires_at (timestamp quando a oferta expira/não está mais disponível)
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance de queries por scaled_at
CREATE INDEX IF NOT EXISTS idx_offers_scaled_at ON public.offers(scaled_at) 
WHERE scaled_at IS NOT NULL;

-- Criar índice para melhorar performance de queries por expires_at
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON public.offers(expires_at) 
WHERE expires_at IS NOT NULL;

-- Criar índice composto para ofertas escalando e ativas
CREATE INDEX IF NOT EXISTS idx_offers_scaled_active ON public.offers(scaled_at, is_active) 
WHERE scaled_at IS NOT NULL AND is_active = true;

-- Comentários
COMMENT ON COLUMN public.offers.scaled_at IS 'Timestamp quando a oferta foi marcada como escalando (via botão Scan)';
COMMENT ON COLUMN public.offers.expires_at IS 'Timestamp quando a oferta expira e não está mais disponível. Se NULL, a oferta não expira.';

-- ============================================
-- FIM DA MIGRATION
-- ============================================








