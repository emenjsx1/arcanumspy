-- ============================================
-- FIX PROFILES UPDATE POLICY - PREVENT INFINITE RECURSION
-- Migration 026: Corrigir política de UPDATE que causa recursão infinita
-- ============================================

-- O problema: A política de UPDATE pode estar usando is_admin() que causa recursão
-- quando tenta verificar o role do usuário durante o UPDATE.

-- Solução: Garantir que a função is_admin() use SECURITY DEFINER e leia diretamente
-- sem passar por RLS, e que as políticas de UPDATE não causem recursão.

-- ============================================
-- 1. RECRIAR FUNÇÃO is_admin() SEM RECURSÃO
-- ============================================
-- Esta função deve usar SECURITY DEFINER e ler diretamente
-- da tabela public.profiles sem passar pelas políticas RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_id UUID;
BEGIN
  -- Obter o ID do usuário autenticado
  user_id := auth.uid();
  
  -- Se não houver usuário autenticado, retornar false
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Usar SECURITY DEFINER para ler diretamente da tabela sem passar por RLS
  -- IMPORTANTE: Especificar o schema 'public' explicitamente para evitar ambiguidade
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Retornar true apenas se o role for exatamente 'admin'
  RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2. REMOVER E RECRIAR POLÍTICAS DE UPDATE
-- ============================================
-- Remover políticas de UPDATE existentes
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Política 1: Usuários podem atualizar seu próprio perfil
-- Esta política NÃO usa is_admin(), então não causa recursão
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política 2: Admins podem atualizar todos os perfis
-- Usa is_admin() que agora tem SECURITY DEFINER e não causa recursão
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- 3. GARANTIR POLÍTICAS DE SELECT E INSERT
-- ============================================
-- Remover e recriar políticas de SELECT para garantir consistência
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Garantir política de INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Comentários
COMMENT ON FUNCTION is_admin() IS 'Verifica se o usuário atual é admin. Usa SECURITY DEFINER para evitar recursão nas políticas RLS.';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Permite que usuários atualizem apenas seu próprio perfil';
COMMENT ON POLICY "Admins can update all profiles" ON profiles IS 'Permite que admins atualizem qualquer perfil';








