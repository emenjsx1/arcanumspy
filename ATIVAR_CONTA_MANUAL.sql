-- ============================================
-- ATIVAR CONTA MANUALMENTE APÓS PAGAMENTO
-- Use este script para ativar a conta de um usuário
-- ============================================

-- Substitua 'keykd47+conta4@gmail.com' pelo email do usuário
-- Ou use o user_id diretamente

-- Opção 1: Ativar por email
UPDATE public.profiles
SET 
  has_active_subscription = true,
  subscription_ends_at = NOW() + INTERVAL '30 days', -- 1 mês
  updated_at = NOW()
WHERE email = 'keykd47+conta4@gmail.com';

-- Opção 2: Ativar por user_id (se souber o ID)
-- UPDATE public.profiles
-- SET 
--   has_active_subscription = true,
--   subscription_ends_at = NOW() + INTERVAL '30 days',
--   updated_at = NOW()
-- WHERE id = 'USER_ID_AQUI';

-- Verificar se foi atualizado
SELECT 
  id,
  email,
  name,
  has_active_subscription,
  subscription_ends_at,
  updated_at
FROM public.profiles
WHERE email = 'keykd47+conta4@gmail.com';

-- Criar subscription também (se necessário)
INSERT INTO public.subscriptions (
  user_id,
  plan_id,
  status,
  started_at,
  current_period_end
)
SELECT 
  p.id,
  (SELECT id FROM public.plans WHERE is_active = true LIMIT 1),
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM public.profiles p
WHERE p.email = 'keykd47+conta4@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET 
  status = 'active',
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW();

-- Criar registro de pagamento (se necessário)
INSERT INTO public.payments (
  user_id,
  plan_id,
  amount_cents,
  currency,
  status,
  paid_at,
  period_start,
  period_end
)
SELECT 
  p.id,
  (SELECT id FROM public.plans WHERE is_active = true LIMIT 1),
  100, -- 1 MT em centavos (valor de teste)
  'MZN',
  'completed',
  NOW(),
  NOW(),
  NOW() + INTERVAL '30 days'
FROM public.profiles p
WHERE p.email = 'keykd47+conta4@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.payments 
  WHERE user_id = p.id 
  AND status = 'completed'
  AND paid_at > NOW() - INTERVAL '1 hour'
);







