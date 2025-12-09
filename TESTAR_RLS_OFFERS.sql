-- ============================================
-- Script para testar a política RLS de offers
-- ============================================
-- Execute este script no Supabase SQL Editor para verificar se a política RLS está funcionando

-- 1. Verificar se a política RLS existe
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
WHERE tablename = 'offers';

-- 2. Verificar se RLS está habilitado na tabela
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'offers';

-- 3. Testar query como usuário autenticado (substitua 'SEU_USER_ID' pelo ID do usuário)
-- Primeiro, obtenha o ID do usuário:
SELECT id, email FROM auth.users LIMIT 5;

-- Depois, teste a query como esse usuário:
-- SET LOCAL role TO authenticated;
-- SET LOCAL request.jwt.claim.sub TO 'SEU_USER_ID';
-- SELECT COUNT(*) FROM offers WHERE is_active = true;

-- 4. Verificar se há ofertas com is_active = true
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as ativas,
  COUNT(*) FILTER (WHERE is_active = false) as inativas
FROM offers;

-- 5. Ver todas as ofertas (como admin, bypassa RLS)
SELECT id, title, is_active, created_at FROM offers ORDER BY created_at DESC;

