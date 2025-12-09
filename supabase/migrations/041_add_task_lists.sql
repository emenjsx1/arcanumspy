-- ============================================
-- ADICIONAR SISTEMA DE LISTAS PARA TAREFAS
-- ============================================
-- IMPORTANTE: Execute a migration 040_create_produtividade_tables.sql primeiro!

-- Garantir que a tabela tarefas existe (caso a migration 040 não tenha sido executada)
CREATE TABLE IF NOT EXISTS tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT NOT NULL DEFAULT 'media',
  prazo TIMESTAMPTZ,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_tarefas_user_id ON tarefas(user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON tarefas(concluida);
CREATE INDEX IF NOT EXISTS idx_tarefas_created_at ON tarefas(created_at DESC);

-- Tabela de listas de tarefas
CREATE TABLE IF NOT EXISTS tarefa_listas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3b82f6', -- Cor da lista (hex)
  ordem INTEGER NOT NULL DEFAULT 0, -- Ordem de exibição
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarefa_listas_user_id ON tarefa_listas(user_id);
CREATE INDEX IF NOT EXISTS idx_tarefa_listas_ordem ON tarefa_listas(user_id, ordem);

-- Adicionar coluna lista_id na tabela tarefas
ALTER TABLE tarefas 
ADD COLUMN IF NOT EXISTS lista_id UUID REFERENCES tarefa_listas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_lista_id ON tarefas(lista_id);

-- Trigger para updated_at (se a função existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_tarefas_updated_at ON tarefas;
    CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON tarefas
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Garantir RLS na tabela tarefas (se não existir)
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tarefas (criar apenas se não existirem)
DO $$
BEGIN
  -- Verificar e criar políticas se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tarefas' 
    AND policyname = 'Users can view their own tarefas'
  ) THEN
    CREATE POLICY "Users can view their own tarefas"
      ON tarefas FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tarefas' 
    AND policyname = 'Users can insert their own tarefas'
  ) THEN
    CREATE POLICY "Users can insert their own tarefas"
      ON tarefas FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tarefas' 
    AND policyname = 'Users can update their own tarefas'
  ) THEN
    CREATE POLICY "Users can update their own tarefas"
      ON tarefas FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tarefas' 
    AND policyname = 'Users can delete their own tarefas'
  ) THEN
    CREATE POLICY "Users can delete their own tarefas"
      ON tarefas FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_tarefa_listas_updated_at ON tarefa_listas;
CREATE TRIGGER update_tarefa_listas_updated_at BEFORE UPDATE ON tarefa_listas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para tarefa_listas
ALTER TABLE tarefa_listas ENABLE ROW LEVEL SECURITY;

-- Criar políticas apenas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tarefa_listas' 
    AND policyname = 'Users can view their own tarefa_listas'
  ) THEN
    CREATE POLICY "Users can view their own tarefa_listas"
      ON tarefa_listas FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tarefa_listas' 
    AND policyname = 'Users can insert their own tarefa_listas'
  ) THEN
    CREATE POLICY "Users can insert their own tarefa_listas"
      ON tarefa_listas FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tarefa_listas' 
    AND policyname = 'Users can update their own tarefa_listas'
  ) THEN
    CREATE POLICY "Users can update their own tarefa_listas"
      ON tarefa_listas FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tarefa_listas' 
    AND policyname = 'Users can delete their own tarefa_listas'
  ) THEN
    CREATE POLICY "Users can delete their own tarefa_listas"
      ON tarefa_listas FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

