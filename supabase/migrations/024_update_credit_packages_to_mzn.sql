-- ============================================
-- UPDATE CREDIT PACKAGES TO MZN (METICAL)
-- ============================================
-- Atualiza os pacotes de créditos para usar Metical (MZN) como moeda
-- e ajusta os preços para valores em MZN

-- Atualizar moeda e preços dos pacotes existentes
-- Nota: Conversão aproximada USD para MZN (1 USD ≈ 64 MZN)
UPDATE credit_packages
SET 
  currency = 'MZN',
  price_cents = CASE 
    WHEN name = 'Pacote Básico' THEN 633600  -- ~99 USD * 64 = 6336 MZN = 633600 centavos
    WHEN name = 'Pacote Popular' THEN 2880000  -- ~450 USD * 64 = 28800 MZN = 2880000 centavos
    WHEN name = 'Pacote Premium' THEN 5440000  -- ~850 USD * 64 = 54400 MZN = 5440000 centavos
    WHEN name = 'Pacote Profissional' THEN 25600000  -- ~4000 USD * 64 = 256000 MZN = 25600000 centavos
    ELSE price_cents
  END
WHERE currency = 'USD';

-- Se os pacotes não existirem, criar novos com MZN
INSERT INTO credit_packages (name, credits, price_cents, currency, bonus_credits, description, is_active)
SELECT * FROM (VALUES
  ('Pacote Básico', 100, 633600, 'MZN', 0, '100 créditos - Ideal para começar', true),
  ('Pacote Popular', 500, 2880000, 'MZN', 50, '500 créditos + 50 bônus = 550 créditos', true),
  ('Pacote Premium', 1000, 5440000, 'MZN', 150, '1000 créditos + 150 bônus = 1150 créditos', true),
  ('Pacote Profissional', 5000, 25600000, 'MZN', 1000, '5000 créditos + 1000 bônus = 6000 créditos', true)
) AS v(name, credits, price_cents, currency, bonus_credits, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM credit_packages WHERE name = v.name
);

-- Comentário
COMMENT ON TABLE credit_packages IS 'Pacotes de créditos disponíveis para compra - Preços em Metical (MZN)';








