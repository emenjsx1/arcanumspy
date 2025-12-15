-- ============================================
-- BLOQUEAR USUÁRIOS SEM PAGAMENTO (EXCETO ADMINS)
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Este script identifica e bloqueia todos os usuários que não têm pagamento ativo,
-- exceto os administradores.

-- PASSO 1: Garantir que a coluna has_active_subscription existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'has_active_subscription'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN has_active_subscription BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- PASSO 2: Atualizar has_active_subscription para FALSE em todos os usuários
-- que não têm subscription ativa E não têm payment completed/paid/confirmed
-- EXCETO os admins

UPDATE public.profiles
SET 
  has_active_subscription = FALSE,
  updated_at = NOW()
WHERE 
  role != 'admin' -- Excluir admins
  AND (
    -- Usuário não tem subscription ativa
    NOT EXISTS (
      SELECT 1 
      FROM public.subscriptions s
      WHERE s.user_id = profiles.id
      AND s.status = 'active'
      AND s.current_period_end > NOW()
    )
    AND
    -- Usuário não tem payment completed/paid/confirmed
    NOT EXISTS (
      SELECT 1 
      FROM public.payments p
      WHERE p.user_id = profiles.id
      AND p.status IN ('completed', 'paid', 'confirmed')
      AND p.paid_at IS NOT NULL
    )
  );

-- PASSO 2.1: Cancelar subscriptions ativas de usuários bloqueados
UPDATE public.subscriptions
SET 
  status = 'canceled',
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE 
  user_id IN (
    SELECT id 
    FROM public.profiles 
    WHERE role != 'admin' 
    AND has_active_subscription = FALSE
  )
  AND status IN ('active', 'trial');

-- PASSO 3: Verificar quantos usuários foram bloqueados
SELECT 
  COUNT(*) as total_usuarios_bloqueados,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins_nao_afetados,
  COUNT(CASE WHEN role != 'admin' AND has_active_subscription = FALSE THEN 1 END) as usuarios_bloqueados
FROM public.profiles;

-- PASSO 4: Listar os usuários bloqueados (para verificação)
SELECT 
  p.id,
  p.name,
  p.role,
  p.email,
  p.has_active_subscription,
  s.status as subscription_status,
  s.current_period_end as subscription_ends_at,
  (
    SELECT COUNT(*) 
    FROM public.payments pay 
    WHERE pay.user_id = p.id 
    AND pay.status IN ('completed', 'paid', 'confirmed')
  ) as payments_completed_count,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE 
  p.role != 'admin'
  AND p.has_active_subscription = FALSE
ORDER BY p.created_at DESC;

-- PASSO 5: (OPCIONAL) Se quiser desbloquear usuários específicos depois,
-- você pode executar:
-- UPDATE public.profiles 
-- SET has_active_subscription = TRUE 
-- WHERE id = 'UUID_DO_USUARIO';

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Este script bloqueia usuários que:
--    - NÃO têm subscription com status 'active' E current_period_end > NOW()
--    - E NÃO têm nenhum payment com status 'completed', 'paid' ou 'confirmed'
--
-- 2. Admins são sempre excluídos do bloqueio
--
-- 3. O campo has_active_subscription é usado pelo sistema para verificar
--    se o usuário pode acessar a plataforma
--
-- 4. IMPORTANTE: Usuários bloqueados SÓ podem ser desbloqueados através de um NOVO PAGAMENTO
--    - Não é possível desbloquear manualmente pelo admin
--    - Quando o usuário faz um pagamento, o sistema automaticamente desbloqueia a conta
--    - O processo de pagamento atualiza has_active_subscription = TRUE automaticamente
--
-- 5. Para desbloquear um usuário, ele DEVE:
--    - Acessar a página de checkout (/checkout)
--    - Selecionar um plano
--    - Realizar o pagamento
--    - Após pagamento confirmado, a conta será desbloqueada automaticamente
--
-- 6. Este script também cancela automaticamente todas as subscriptions ativas
--    dos usuários que foram bloqueados

