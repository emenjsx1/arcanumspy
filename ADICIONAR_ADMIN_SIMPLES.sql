-- ============================================
-- ADICIONAR ADMIN POR EMAIL - VERSÃO SIMPLES
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Substitua 'seu-email@exemplo.com' pelo email do usuário
-- 2. Execute no SQL Editor do Supabase
-- 3. Pronto! O usuário será admin
--
-- ============================================

-- Atualizar role para admin
UPDATE public.profiles
SET role = 'admin'::user_role
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'seu-email@exemplo.com'
);

-- Verificar se funcionou
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'seu-email@exemplo.com';

-- ============================================
-- EXEMPLO PRÁTICO:
-- ============================================
-- Para tornar "admin@arcanumspy.com" como admin:
--
-- UPDATE public.profiles
-- SET role = 'admin'::user_role
-- WHERE id IN (
--   SELECT id FROM auth.users 
--   WHERE email = 'admin@arcanumspy.com'
-- );







