-- ============================================
-- Garantir que o perfil existe e está como admin
-- Email: emenjoseph7+conta2@gmail.com
-- ============================================

-- Primeiro, garantir que o perfil existe para este usuário
INSERT INTO profiles (id, name, email, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email, 'User'),
  u.email,
  'admin' -- Definir como admin
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

-- Verificar se foi atualizado corretamente
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email,
  CASE 
    WHEN p.role = 'admin' THEN '✅ É ADMIN'
    ELSE '❌ NÃO É ADMIN'
  END as status
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE u.email = 'emenjoseph7+conta2@gmail.com';












