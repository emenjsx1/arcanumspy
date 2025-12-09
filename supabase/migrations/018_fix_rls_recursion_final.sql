-- ============================================
-- CORREÇÃO DEFINITIVA - RECURSÃO INFINITA RLS
-- ============================================
-- Problema: A política "Admins can view all profiles" usa is_admin()
-- que tenta acessar profiles, causando recursão infinita.
-- Solução: Remover a política problemática e recriar is_admin() de forma segura

-- 1. Remover a política problemática que causa recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 2. Recriar a função is_admin() usando uma abordagem que evita recursão
-- Usando SET LOCAL para desabilitar RLS temporariamente dentro da função
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Usar SET LOCAL para desabilitar RLS temporariamente
  -- Isso evita a recursão infinita quando a função é chamada dentro de políticas RLS
  PERFORM set_config('row_security', 'off', true);
  
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Restaurar RLS
  PERFORM set_config('row_security', 'on', true);
  
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir que existe política de INSERT para profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- NOTA: A política "Admins can view all profiles" foi removida para evitar recursão.
-- Admins podem acessar perfis através de APIs que usam admin client (service role),
-- ou através de outras rotas que não dependem de RLS.












