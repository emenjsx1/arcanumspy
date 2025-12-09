-- ============================================
-- FIX RLS POLICIES FOR tarefa_listas
-- Migration 052: Corrigir políticas RLS da tabela tarefa_listas
-- ============================================
-- Problema: Erro 42501 - "new row violates row-level security policy"
-- Solução: Remover e recriar todas as políticas RLS

-- ============================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ============================================
DROP POLICY IF EXISTS "Users can view their own tarefa_listas" ON tarefa_listas;
DROP POLICY IF EXISTS "Users can insert their own tarefa_listas" ON tarefa_listas;
DROP POLICY IF EXISTS "Users can update their own tarefa_listas" ON tarefa_listas;
DROP POLICY IF EXISTS "Users can delete their own tarefa_listas" ON tarefa_listas;

-- ============================================
-- 2. GARANTIR QUE RLS ESTÁ ATIVADO
-- ============================================
ALTER TABLE tarefa_listas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RECRIAR POLÍTICAS RLS CORRETAMENTE
-- ============================================

-- SELECT: Usuários podem ver suas próprias listas
CREATE POLICY "Users can view their own tarefa_listas"
  ON tarefa_listas
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Usuários podem criar suas próprias listas
-- IMPORTANTE: WITH CHECK garante que o user_id inserido seja do usuário autenticado
CREATE POLICY "Users can insert their own tarefa_listas"
  ON tarefa_listas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários podem atualizar suas próprias listas
CREATE POLICY "Users can update their own tarefa_listas"
  ON tarefa_listas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários podem deletar suas próprias listas
CREATE POLICY "Users can delete their own tarefa_listas"
  ON tarefa_listas
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ============================================
-- Execute esta query para verificar:
-- SELECT * FROM pg_policies WHERE tablename = 'tarefa_listas';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

