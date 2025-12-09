-- ============================================
-- Definir usuário como admin pelo email
-- ============================================

-- Atualizar role para admin baseado no email
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'emenjoseph7+conta2@gmail.com'
);

-- Verificar se o perfil foi atualizado
-- Se o perfil não existir, criar um novo com role admin
INSERT INTO profiles (id, name, email, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email),
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
  email = COALESCE(profiles.email, EXCLUDED.email);












