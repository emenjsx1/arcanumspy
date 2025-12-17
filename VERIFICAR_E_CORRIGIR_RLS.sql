-- ============================================
-- VERIFICAR E CORRIGIR POLÍTICAS RLS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'tarefa_listas'
) AS tabela_existe;

-- 2. Verificar políticas RLS atuais
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
WHERE tablename = 'tarefa_listas';

-- 3. Verificar se RLS está ativado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'tarefa_listas';

-- 4. REMOVER TODAS AS POLÍTICAS (se necessário)
DROP POLICY IF EXISTS "Users can view their own tarefa_listas" ON tarefa_listas;
DROP POLICY IF EXISTS "Users can insert their own tarefa_listas" ON tarefa_listas;
DROP POLICY IF EXISTS "Users can update their own tarefa_listas" ON tarefa_listas;
DROP POLICY IF EXISTS "Users can delete their own tarefa_listas" ON tarefa_listas;

-- 5. GARANTIR QUE RLS ESTÁ ATIVADO
ALTER TABLE tarefa_listas ENABLE ROW LEVEL SECURITY;

-- 6. RECRIAR POLÍTICAS CORRETAMENTE
CREATE POLICY "Users can view their own tarefa_listas"
  ON tarefa_listas
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tarefa_listas"
  ON tarefa_listas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tarefa_listas"
  ON tarefa_listas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tarefa_listas"
  ON tarefa_listas
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. VERIFICAR POLÍTICAS CRIADAS
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tarefa_listas'
ORDER BY policyname;

-- 8. TESTAR INSERÇÃO (substitua 'SEU_USER_ID_AQUI' pelo UUID do seu usuário)
-- Descomente e execute para testar:
/*
INSERT INTO tarefa_listas (user_id, nome, cor, ordem)
VALUES (
  auth.uid(),  -- Use auth.uid() para testar com o usuário atual
  'Lista de Teste',
  '#3b82f6',
  0
)
RETURNING *;
*/







