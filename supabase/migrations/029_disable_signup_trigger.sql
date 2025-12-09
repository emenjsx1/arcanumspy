-- ============================================
-- DISABLE SIGNUP TRIGGER - MOVE TO APPLICATION CODE
-- Migration 029: Desativar trigger handle_new_user() e mover lógica para código
-- ============================================

-- Esta migration desativa o trigger que cria perfis automaticamente
-- A criação de perfis será feita no código da aplicação após o signup
-- Isso evita que erros no trigger quebrem o signup

-- ============================================
-- 1. DESATIVAR TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- 2. REMOVER FUNÇÃO (OPCIONAL - PODE MANTER PARA REFERÊNCIA)
-- ============================================
-- Não vamos remover a função, apenas desativar o trigger
-- A função pode ser útil para referência futura
-- Se quiser remover completamente, descomente a linha abaixo:
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- 3. GARANTIR QUE A TABELA PROFILES ESTÁ CORRETA
-- ============================================
-- Verificar se todos os campos NOT NULL têm DEFAULT ou são nullable
-- Se algum campo foi adicionado sem DEFAULT, vamos garantir que tenha

-- Garantir que a coluna email existe e é nullable
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Garantir que a coluna banned existe e tem DEFAULT
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

-- Comentários
COMMENT ON TABLE public.profiles IS 'Perfis de usuários. Criados manualmente no código após signup para evitar que erros quebrem o signup.';








