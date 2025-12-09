-- ============================================
-- Script para CORRIGIR a política RLS de offers
-- ============================================
-- Execute este script no Supabase SQL Editor

-- 1. Verificar políticas atuais
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

-- 2. Remover política antiga (se existir)
DROP POLICY IF EXISTS "Authenticated users can view active offers" ON offers;

-- 3. Criar nova política que permite usuários autenticados ver ofertas ativas
CREATE POLICY "Authenticated users can view active offers"
  ON offers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 4. Verificar se RLS está habilitado
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se a política foi criada corretamente
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'offers' AND policyname = 'Authenticated users can view active offers';

-- 6. Testar a política (substitua 'SEU_USER_ID' pelo ID do usuário)
-- Primeiro, obtenha o ID do usuário:
-- SELECT id, email FROM auth.users WHERE email = 'keykd47+conta2@gmail.com';

-- Depois, teste como esse usuário:
-- SET LOCAL role TO authenticated;
-- SET LOCAL request.jwt.claim.sub TO '994f3619-15b8-4748-9393-215da0ec1b0b';
-- SELECT COUNT(*) FROM offers WHERE is_active = true;

