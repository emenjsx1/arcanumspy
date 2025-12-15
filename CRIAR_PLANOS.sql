-- ============================================
-- CRIAR PLANOS NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Inserir planos Mensal, Trimestral e Anual (os que o sistema usa)
-- NOTA: price_monthly_cents é o preço mensal equivalente em centavos
-- Para Trimestral: 2160 MT = 216000 centavos (mas é pago de uma vez, não mensalmente)
-- Para Anual: 7680 MT = 768000 centavos (mas é pago de uma vez, não mensalmente)
INSERT INTO "public"."plans" 
  ("name", "slug", "description", "price_monthly_cents", "is_active", "created_at") 
VALUES 
  ('Mensal', 'mensal', 'Plano mensal - 800 MT', 80000, true, NOW()),
  ('Trimestral', 'trimestral', 'Plano trimestral - 2160 MT (10% desconto)', 216000, true, NOW()),
  ('Anual', 'anual', 'Plano anual - 7680 MT (20% desconto)', 768000, true, NOW())
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  is_active = EXCLUDED.is_active;

-- Verificar se os planos foram criados
SELECT 
  id,
  name,
  slug,
  description,
  price_monthly_cents,
  is_active,
  created_at
FROM "public"."plans"
WHERE slug IN ('mensal', 'trimestral', 'anual')
ORDER BY price_monthly_cents;

