-- ============================================
-- SCRIPT DE CORREÇÃO URGENTE - EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================
-- Este script vai:
-- 1. Criar o perfil se não existir
-- 2. Definir como admin se for o email correto
-- 3. Atualizar email e nome se necessário
-- ============================================

-- Garantir política de INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Criar/Atualizar perfil do usuário admin
INSERT INTO profiles (id, name, email, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User'),
  u.email,
  CASE 
    WHEN u.email = 'emenjoseph7+conta2@gmail.com' THEN 'admin'
    ELSE 'user'
  END
FROM auth.users u
WHERE u.email = 'emenjoseph7+conta2@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = CASE 
    WHEN EXCLUDED.email = 'emenjoseph7+conta2@gmail.com' THEN 'admin'
    ELSE profiles.role
  END,
  email = COALESCE(profiles.email, EXCLUDED.email),
  name = COALESCE(profiles.name, EXCLUDED.name);

-- Verificar resultado
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
WHERE u.email = 'emenjoseph7+conta2@gmail.com';












