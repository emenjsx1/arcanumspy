-- ============================================
-- FIX SIGNUP - VERSÃO SIMPLES E DIRETA
-- Migration 028: Versão simplificada do trigger para garantir que funcione
-- ============================================

-- Este é um trigger mais simples que garante que todos os campos NOT NULL sejam preenchidos
-- e não quebra o signup mesmo se houver erro

-- ============================================
-- 1. RECRIAR TRIGGER handle_new_user() - VERSÃO SIMPLES
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
  user_role_val user_role;
BEGIN
  -- Garantir que name NUNCA seja NULL (campo NOT NULL)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );
  
  -- Email (opcional, mas vamos preencher se possível)
  user_email := NEW.email;
  
  -- Role (NOT NULL, mas tem DEFAULT 'user' - vamos preencher explicitamente)
  IF NEW.email = 'emenmurromua@gmail.com' THEN
    user_role_val := 'admin'::user_role;
  ELSE
    user_role_val := 'user'::user_role;
  END IF;
  
  -- Inserir perfil - versão mais simples possível
  -- Apenas os campos obrigatórios: id, name, role
  -- Os outros campos (email, created_at, updated_at, banned) têm DEFAULT ou são nullable
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    user_name,
    user_role_val
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Se a coluna email existir, atualizar depois (opcional)
  -- Isso evita erro se a coluna não existir
  BEGIN
    UPDATE public.profiles 
    SET email = user_email 
    WHERE id = NEW.id AND (email IS NULL OR email = '');
  EXCEPTION
    WHEN undefined_column THEN
      -- Coluna email não existe, tudo bem
      NULL;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de qualquer erro, logar mas NÃO quebrar o signup
    -- O Supabase precisa que o trigger retorne NEW
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. GARANTIR QUE O TRIGGER ESTÁ ATIVO
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. VERIFICAR E GARANTIR POLÍTICA DE INSERT
-- ============================================
-- A política de INSERT deve permitir que o trigger crie perfis
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Comentários
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria perfil automaticamente quando um novo usuário é criado. Versão simplificada que garante que todos os campos NOT NULL sejam preenchidos.';








