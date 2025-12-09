-- ============================================
-- SOLUÇÃO DEFINITIVA - EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================
-- Execute este SQL COMPLETO no Supabase SQL Editor
-- ============================================

-- 1. Garantir política de INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Função para criar perfil (bypass RLS)
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id UUID, user_email TEXT, user_name TEXT, user_role TEXT DEFAULT 'user')
RETURNS profiles AS $$
DECLARE
  new_profile profiles;
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (user_id, user_name, user_email, user_role::user_role)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(profiles.email, EXCLUDED.email),
    name = COALESCE(profiles.name, EXCLUDED.name),
    role = EXCLUDED.role
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar/Atualizar perfil do usuário admin DIRETAMENTE (bypass RLS)
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'emenjoseph7+conta2@gmail.com';
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    -- Inserir ou atualizar perfil diretamente (sem RLS)
    INSERT INTO profiles (id, name, email, role)
    VALUES (
      admin_user_id,
      SPLIT_PART(admin_email, '@', 1),
      admin_email,
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'admin',
      email = admin_email,
      name = COALESCE(profiles.name, SPLIT_PART(admin_email, '@', 1));
    
    RAISE NOTICE 'Perfil criado/atualizado para: % (ID: %)', admin_email, admin_user_id;
  ELSE
    RAISE NOTICE 'Usuário não encontrado: %', admin_email;
  END IF;
END $$;

-- 4. Verificar resultado
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email,
  u.created_at as user_created,
  p.created_at as profile_created,
  CASE 
    WHEN p.role = 'admin' THEN '✅ É ADMIN - PODE ACESSAR /admin/dashboard'
    WHEN p.role = 'user' THEN '⚠️ É USUÁRIO - NÃO PODE ACESSAR /admin/dashboard'
    ELSE '❌ ERRO'
  END as status
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE u.email = 'emenjoseph7+conta2@gmail.com';

-- 5. Se ainda não funcionar, verificar se o usuário existe
SELECT 
  id,
  email,
  created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id) THEN '✅ Tem perfil'
    ELSE '❌ SEM PERFIL'
  END as tem_perfil
FROM auth.users
WHERE email = 'emenjoseph7+conta2@gmail.com';












