-- ============================================
-- FIX RLS POLICIES FOR tarefas
-- Migration 053: Corrigir políticas RLS da tabela tarefas
-- ============================================
-- Problema: Erro 42501 - "new row violates row-level security policy"
-- Solução: Remover e recriar todas as políticas RLS

-- ============================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ============================================
DROP POLICY IF EXISTS "Users can view their own tarefas" ON tarefas;
DROP POLICY IF EXISTS "Users can insert their own tarefas" ON tarefas;
DROP POLICY IF EXISTS "Users can update their own tarefas" ON tarefas;
DROP POLICY IF EXISTS "Users can delete their own tarefas" ON tarefas;

-- ============================================
-- 2. GARANTIR QUE RLS ESTÁ ATIVADO
-- ============================================
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RECRIAR POLÍTICAS RLS CORRETAMENTE
-- ============================================

-- SELECT: Usuários podem ver suas próprias tarefas
CREATE POLICY "Users can view their own tarefas"
  ON tarefas
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Usuários podem criar suas próprias tarefas
-- IMPORTANTE: WITH CHECK garante que o user_id inserido seja do usuário autenticado
CREATE POLICY "Users can insert their own tarefas"
  ON tarefas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários podem atualizar suas próprias tarefas
CREATE POLICY "Users can update their own tarefas"
  ON tarefas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários podem deletar suas próprias tarefas
CREATE POLICY "Users can delete their own tarefas"
  ON tarefas
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ============================================
-- Execute esta query para verificar:
-- SELECT * FROM pg_policies WHERE tablename = 'tarefas';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

