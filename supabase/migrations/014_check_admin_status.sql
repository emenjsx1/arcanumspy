-- ============================================
-- Verificar status de admin do usuário
-- Email: emenjoseph7+conta2@gmail.com
-- ============================================

-- Verificar se o usuário existe e qual é seu role
SELECT 
  u.id as user_id,
  u.email as auth_email,
  u.created_at as user_created_at,
  p.id as profile_id,
  p.name as profile_name,
  p.email as profile_email,
  p.role as current_role,
  CASE 
    WHEN p.role = 'admin' THEN '✅ É ADMIN'
    WHEN p.role = 'user' THEN '❌ É USUÁRIO COMUM'
    WHEN p.id IS NULL THEN '⚠️ PERFIL NÃO EXISTE'
    ELSE '❓ ROLE DESCONHECIDO'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'emenjoseph7+conta2@gmail.com';

-- Se não retornar nenhum resultado, o usuário não existe ainda
-- Se retornar com role = 'user', precisa ser atualizado
-- Se retornar com role = 'admin', já está configurado corretamente












