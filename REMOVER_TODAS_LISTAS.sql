-- ============================================
-- REMOVER TODAS AS LISTAS DE TAREFAS
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- ATENÇÃO: Isso vai deletar TODAS as listas de TODOS os usuários!
-- Use com cuidado!

-- Ver quantas listas existem antes de deletar
SELECT COUNT(*) AS total_listas FROM tarefa_listas;

-- Ver listas por usuário
SELECT 
  user_id,
  COUNT(*) AS total_listas
FROM tarefa_listas
GROUP BY user_id
ORDER BY total_listas DESC;

-- ============================================
-- DELETAR TODAS AS LISTAS
-- ============================================
-- Descomente a linha abaixo para executar a deleção:
DELETE FROM tarefa_listas;

-- OU deletar apenas as listas de um usuário específico:
-- Substitua 'SEU_USER_ID_AQUI' pelo UUID do seu usuário
-- DELETE FROM tarefa_listas WHERE user_id = 'SEU_USER_ID_AQUI';

-- ============================================
-- VERIFICAR APÓS DELEÇÃO
-- ============================================
SELECT COUNT(*) AS listas_restantes FROM tarefa_listas;

-- ============================================
-- NOTA: As tarefas associadas às listas NÃO serão deletadas
-- Se você também quiser deletar as tarefas, execute:
-- ============================================
-- DELETE FROM tarefas WHERE lista_id IS NOT NULL;
-- OU
-- DELETE FROM tarefas; -- Deleta TODAS as tarefas

