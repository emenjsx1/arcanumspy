-- ============================================
-- Script para verificar e ativar ofertas
-- ============================================
-- Este script verifica o status das ofertas e ativa todas elas
-- Execute no Supabase SQL Editor

-- 1. Verificar quantas ofertas existem e quantas estão ativas
SELECT 
  COUNT(*) as total_ofertas,
  COUNT(*) FILTER (WHERE is_active = true) as ofertas_ativas,
  COUNT(*) FILTER (WHERE is_active = false OR is_active IS NULL) as ofertas_inativas
FROM offers;

-- 2. Ver detalhes das ofertas
SELECT 
  id,
  title,
  is_active,
  created_at,
  updated_at
FROM offers
ORDER BY created_at DESC;

-- 3. Ativar TODAS as ofertas (descomente se quiser executar)
-- UPDATE offers
-- SET is_active = true,
--     updated_at = NOW()
-- WHERE is_active = false OR is_active IS NULL;

-- 4. Verificar novamente após atualização
-- SELECT 
--   COUNT(*) as total_ofertas,
--   COUNT(*) FILTER (WHERE is_active = true) as ofertas_ativas
-- FROM offers;







