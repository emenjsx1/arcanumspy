-- ============================================
-- Script para ATIVAR TODAS as ofertas
-- ============================================
-- Execute este script no Supabase SQL Editor para ativar todas as ofertas
-- Isso fará com que elas apareçam na página /espionagem/ofertas-escaladas

-- Ativar TODAS as ofertas (define is_active = true para todas)
UPDATE offers
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false OR is_active IS NULL;

-- Verificar resultado
SELECT 
  COUNT(*) as total_ofertas,
  COUNT(*) FILTER (WHERE is_active = true) as ofertas_ativas,
  COUNT(*) FILTER (WHERE is_active = false) as ofertas_inativas
FROM offers;







