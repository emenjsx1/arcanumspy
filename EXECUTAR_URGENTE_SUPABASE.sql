-- ============================================
-- ⚠️ EXECUTAR URGENTEMENTE NO SUPABASE SQL EDITOR ⚠️
-- ============================================
-- Este script corrige a recursão infinita nas políticas RLS
-- que está impedindo o carregamento de perfis
-- ============================================

-- 1. Remover a política problemática que causa recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 2. Recriar a função is_admin() de forma segura
-- Usando SET LOCAL para desabilitar RLS temporariamente
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Desabilitar RLS temporariamente para evitar recursão
  PERFORM set_config('row_security', 'off', true);
  
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Restaurar RLS
  PERFORM set_config('row_security', 'on', true);
  
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir política de INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Verificar se funcionou
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email,
  CASE 
    WHEN p.role = 'admin' THEN '✅ É ADMIN'
    WHEN p.role = 'user' THEN '✅ É USUÁRIO'
    ELSE '❌ ERRO'
  END as status
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('emenjoseph7+conta2@gmail.com', 'emenmurromua@gmail.com');

-- ============================================
-- Após executar, recarregue a página do dashboard
-- ============================================












