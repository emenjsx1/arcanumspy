-- ============================================
-- CORREÇÃO URGENTE - RECURSÃO INFINITA RLS
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================

-- 1. Remover a política problemática que causa recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 2. Recriar a função is_admin() de forma mais segura
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Acessar diretamente profiles com SECURITY DEFINER
  -- Isso deveria bypassar RLS, mas vamos garantir que não haja recursão
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir que existe política de INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Testar se a função is_admin() funciona
-- (Execute isso manualmente após aplicar a migração)
-- SELECT is_admin();












