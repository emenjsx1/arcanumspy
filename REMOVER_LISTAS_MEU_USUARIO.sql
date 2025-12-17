-- ============================================
-- REMOVER LISTAS DO MEU USUÁRIO APENAS
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- Este script remove apenas as listas do usuário atual logado

-- 1. PRIMEIRO: Descobrir seu user_id
-- Execute esta query e copie o UUID retornado:
SELECT auth.uid() AS meu_user_id;

-- 2. Ver suas listas antes de deletar
SELECT 
  id,
  nome,
  cor,
  ordem,
  created_at
FROM tarefa_listas
WHERE user_id = auth.uid()
ORDER BY ordem;

-- 3. Contar quantas listas você tem
SELECT COUNT(*) AS minhas_listas
FROM tarefa_listas
WHERE user_id = auth.uid();

-- ============================================
-- 4. DELETAR TODAS AS SUAS LISTAS
-- ============================================
-- Descomente a linha abaixo para deletar:
DELETE FROM tarefa_listas WHERE user_id = auth.uid();

-- ============================================
-- 5. VERIFICAR APÓS DELEÇÃO
-- ============================================
SELECT COUNT(*) AS listas_restantes
FROM tarefa_listas
WHERE user_id = auth.uid();

-- ============================================
-- OPCIONAL: Deletar também as tarefas associadas
-- ============================================
-- Se você também quiser deletar as tarefas que estavam nas listas:
-- DELETE FROM tarefas WHERE user_id = auth.uid() AND lista_id IS NOT NULL;







