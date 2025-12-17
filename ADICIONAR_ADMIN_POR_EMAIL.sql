-- ============================================
-- ADICIONAR ADMIN POR EMAIL
-- Execute este SQL no SQL Editor do Supabase
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Substitua 'seu-email@exemplo.com' pelo email do usuário que deseja tornar admin
-- 2. Execute o SQL no SQL Editor do Supabase
-- 3. O usuário deve já existir no sistema (ter feito signup)
--
-- ============================================

-- Opção 1: Atualizar role para admin usando email
-- (Funciona se a tabela profiles tem coluna email)
UPDATE public.profiles
SET role = 'admin'::user_role
WHERE email = 'seu-email@exemplo.com'
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = profiles.id 
    AND auth.users.email = 'seu-email@exemplo.com'
  );

-- Verificar se foi atualizado
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
-- ALTERNATIVA: Se a tabela profiles NÃO tem coluna email
-- ============================================

-- Opção 2: Atualizar role para admin usando email do auth.users
UPDATE public.profiles
SET role = 'admin'::user_role
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'seu-email@exemplo.com'
);

-- Verificar se foi atualizado
SELECT 
  p.id,
  p.name,
  p.role,
  u.email as email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'seu-email@exemplo.com';

-- ============================================
-- CRIAR PERFIL SE NÃO EXISTIR
-- ============================================
-- Se o usuário existe no auth.users mas não tem perfil,
-- este SQL cria o perfil como admin:

INSERT INTO public.profiles (id, name, role, email)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User'),
  'admin'::user_role,
  u.email
FROM auth.users u
WHERE u.email = 'seu-email@exemplo.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO UPDATE
SET role = 'admin'::user_role;

-- ============================================
-- EXEMPLO DE USO
-- ============================================
-- Para tornar o usuário com email "admin@arcanumspy.com" como admin:

-- UPDATE public.profiles
-- SET role = 'admin'::user_role
-- WHERE id IN (
--   SELECT id FROM auth.users 
--   WHERE email = 'admin@arcanumspy.com'
-- );

-- ============================================
-- VERIFICAR TODOS OS ADMINS
-- ============================================
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email,
  u.created_at as user_created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;







