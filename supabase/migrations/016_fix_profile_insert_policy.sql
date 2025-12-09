-- ============================================
-- Corrigir políticas RLS para permitir criação de perfil
-- ============================================

-- Permitir que usuários criem seus próprios perfis
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Atualizar função handle_new_user para incluir email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(profiles.email, NEW.email),
    name = COALESCE(profiles.name, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para garantir que o perfil existe (pode ser chamada pelo usuário)
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS profiles AS $$
DECLARE
  user_id UUID;
  user_email TEXT;
  user_name TEXT;
  existing_profile profiles;
BEGIN
  -- Obter informações do usuário atual
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Buscar informações do usuário
  SELECT email, COALESCE(raw_user_meta_data->>'name', email) INTO user_email, user_name
  FROM auth.users
  WHERE id = user_id;
  
  -- Verificar se o perfil já existe
  SELECT * INTO existing_profile
  FROM profiles
  WHERE id = user_id;
  
  IF existing_profile IS NULL THEN
    -- Criar perfil se não existir
    INSERT INTO profiles (id, name, email, role)
    VALUES (user_id, user_name, user_email, 'user')
    RETURNING * INTO existing_profile;
  ELSE
    -- Atualizar email se necessário
    IF existing_profile.email IS NULL OR existing_profile.email = '' THEN
      UPDATE profiles
      SET email = user_email
      WHERE id = user_id
      RETURNING * INTO existing_profile;
    END IF;
  END IF;
  
  RETURN existing_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o perfil do usuário admin existe
INSERT INTO profiles (id, name, email, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email, 'User'),
  u.email,
  'admin'
FROM auth.users u
WHERE u.email = 'emenjoseph7+conta2@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  email = COALESCE(profiles.email, EXCLUDED.email),
  name = COALESCE(profiles.name, EXCLUDED.name);












