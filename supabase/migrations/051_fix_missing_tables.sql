-- ============================================
-- ARCANUMSPY - FIX MISSING TABLES
-- Migration consolidada para criar todas as tabelas faltantes
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. FUNÇÃO HELPER update_updated_at_column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 2. TABELAS DE BIBLIOTECA
-- ============================================

-- Tabela de pastas da biblioteca
CREATE TABLE IF NOT EXISTS biblioteca_pastas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT, -- Cor da pasta (opcional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de itens da biblioteca (ofertas, criativos, etc)
CREATE TABLE IF NOT EXISTS biblioteca_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pasta_id UUID NOT NULL REFERENCES biblioteca_pastas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'oferta', 'criativo', 'manual'
  item_id UUID, -- ID da oferta ou criativo (se existir na plataforma)
  titulo TEXT NOT NULL,
  url TEXT, -- URL da oferta/criativo
  descricao TEXT,
  notas TEXT, -- Notas pessoais do usuário
  imagem_url TEXT, -- URL da imagem (opcional)
  ordem INTEGER DEFAULT 0, -- Para organização manual
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para biblioteca
CREATE INDEX IF NOT EXISTS idx_biblioteca_pastas_user_id ON biblioteca_pastas(user_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_itens_pasta_id ON biblioteca_itens(pasta_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_itens_user_id ON biblioteca_itens(user_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_itens_tipo ON biblioteca_itens(tipo);
CREATE INDEX IF NOT EXISTS idx_biblioteca_itens_ordem ON biblioteca_itens(pasta_id, ordem);

-- Triggers para biblioteca
DROP TRIGGER IF EXISTS update_biblioteca_pastas_updated_at ON biblioteca_pastas;
CREATE TRIGGER update_biblioteca_pastas_updated_at BEFORE UPDATE ON biblioteca_pastas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_biblioteca_itens_updated_at ON biblioteca_itens;
CREATE TRIGGER update_biblioteca_itens_updated_at BEFORE UPDATE ON biblioteca_itens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para biblioteca
ALTER TABLE biblioteca_pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblioteca_itens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para biblioteca_pastas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'biblioteca_pastas' 
    AND policyname = 'Users can view their own folders'
  ) THEN
    CREATE POLICY "Users can view their own folders"
      ON biblioteca_pastas FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'biblioteca_pastas' 
    AND policyname = 'Users can create their own folders'
  ) THEN
    CREATE POLICY "Users can create their own folders"
      ON biblioteca_pastas FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'biblioteca_pastas' 
    AND policyname = 'Users can update their own folders'
  ) THEN
    CREATE POLICY "Users can update their own folders"
      ON biblioteca_pastas FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'biblioteca_pastas' 
    AND policyname = 'Users can delete their own folders'
  ) THEN
    CREATE POLICY "Users can delete their own folders"
      ON biblioteca_pastas FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Políticas RLS para biblioteca_itens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'biblioteca_itens' 
    AND policyname = 'Users can view their own items'
  ) THEN
    CREATE POLICY "Users can view their own items"
      ON biblioteca_itens FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'biblioteca_itens' 
    AND policyname = 'Users can create their own items'
  ) THEN
    CREATE POLICY "Users can create their own items"
      ON biblioteca_itens FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'biblioteca_itens' 
    AND policyname = 'Users can update their own items'
  ) THEN
    CREATE POLICY "Users can update their own items"
      ON biblioteca_itens FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'biblioteca_itens' 
    AND policyname = 'Users can delete their own items'
  ) THEN
    CREATE POLICY "Users can delete their own items"
      ON biblioteca_itens FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 3. TABELA TAREFA_LISTAS (deve vir antes de tarefas por causa da foreign key)
-- ============================================

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

-- Trigger para tarefa_listas
DROP TRIGGER IF EXISTS update_tarefa_listas_updated_at ON tarefa_listas;
CREATE TRIGGER update_tarefa_listas_updated_at BEFORE UPDATE ON tarefa_listas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para tarefa_listas
ALTER TABLE tarefa_listas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tarefa_listas
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

-- ============================================
-- 4. TABELA TAREFAS (depois de tarefa_listas por causa da foreign key)
-- ============================================

CREATE TABLE IF NOT EXISTS tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT NOT NULL DEFAULT 'media', -- 'baixa', 'media', 'alta'
  prazo TIMESTAMPTZ,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantir que a coluna lista_id existe (caso a tabela já exista sem essa coluna)
ALTER TABLE tarefas 
ADD COLUMN IF NOT EXISTS lista_id UUID REFERENCES tarefa_listas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_user_id ON tarefas(user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON tarefas(concluida);
CREATE INDEX IF NOT EXISTS idx_tarefas_created_at ON tarefas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tarefas_lista_id ON tarefas(lista_id);

-- Trigger para tarefas
DROP TRIGGER IF EXISTS update_tarefas_updated_at ON tarefas;
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para tarefas
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tarefas
DO $$
BEGIN
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
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
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

-- ============================================
-- 5. TABELA METAS
-- ============================================

CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_objetivo DECIMAL(12, 2) NOT NULL,
  valor_atual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  prazo TIMESTAMPTZ,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_concluida ON metas(concluida);
CREATE INDEX IF NOT EXISTS idx_metas_created_at ON metas(created_at DESC);

-- Trigger para metas
DROP TRIGGER IF EXISTS update_metas_updated_at ON metas;
CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON metas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para metas
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para metas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metas' 
    AND policyname = 'Users can view their own metas'
  ) THEN
    CREATE POLICY "Users can view their own metas"
      ON metas FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metas' 
    AND policyname = 'Users can insert their own metas'
  ) THEN
    CREATE POLICY "Users can insert their own metas"
      ON metas FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metas' 
    AND policyname = 'Users can update their own metas'
  ) THEN
    CREATE POLICY "Users can update their own metas"
      ON metas FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metas' 
    AND policyname = 'Users can delete their own metas'
  ) THEN
    CREATE POLICY "Users can delete their own metas"
      ON metas FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 6. TABELA ANOTACOES
-- ============================================

CREATE TABLE IF NOT EXISTS anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  tags TEXT[], -- Array de tags
  cor TEXT DEFAULT '#ff5a1f', -- Cor da anotação
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantir que a coluna cor existe (caso a tabela já exista)
ALTER TABLE anotacoes 
ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT '#ff5a1f';

CREATE INDEX IF NOT EXISTS idx_anotacoes_user_id ON anotacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_created_at ON anotacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tags ON anotacoes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_anotacoes_cor ON anotacoes(cor);

-- Trigger para anotacoes
DROP TRIGGER IF EXISTS update_anotacoes_updated_at ON anotacoes;
CREATE TRIGGER update_anotacoes_updated_at BEFORE UPDATE ON anotacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para anotacoes
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para anotacoes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'anotacoes' 
    AND policyname = 'Users can view their own anotacoes'
  ) THEN
    CREATE POLICY "Users can view their own anotacoes"
      ON anotacoes FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'anotacoes' 
    AND policyname = 'Users can insert their own anotacoes'
  ) THEN
    CREATE POLICY "Users can insert their own anotacoes"
      ON anotacoes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'anotacoes' 
    AND policyname = 'Users can update their own anotacoes'
  ) THEN
    CREATE POLICY "Users can update their own anotacoes"
      ON anotacoes FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'anotacoes' 
    AND policyname = 'Users can delete their own anotacoes'
  ) THEN
    CREATE POLICY "Users can delete their own anotacoes"
      ON anotacoes FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 7. TABELA TRANSACOES_FINANCEIRAS
-- ============================================

CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'receita' ou 'despesa'
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outros',
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_user_id ON transacoes_financeiras(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_tipo ON transacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_data ON transacoes_financeiras(data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_categoria ON transacoes_financeiras(categoria);

-- Trigger para transacoes_financeiras
DROP TRIGGER IF EXISTS update_transacoes_financeiras_updated_at ON transacoes_financeiras;
CREATE TRIGGER update_transacoes_financeiras_updated_at BEFORE UPDATE ON transacoes_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para transacoes_financeiras
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para transacoes_financeiras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'transacoes_financeiras' 
    AND policyname = 'Users can view their own transacoes_financeiras'
  ) THEN
    CREATE POLICY "Users can view their own transacoes_financeiras"
      ON transacoes_financeiras FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'transacoes_financeiras' 
    AND policyname = 'Users can insert their own transacoes_financeiras'
  ) THEN
    CREATE POLICY "Users can insert their own transacoes_financeiras"
      ON transacoes_financeiras FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'transacoes_financeiras' 
    AND policyname = 'Users can update their own transacoes_financeiras'
  ) THEN
    CREATE POLICY "Users can update their own transacoes_financeiras"
      ON transacoes_financeiras FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'transacoes_financeiras' 
    AND policyname = 'Users can delete their own transacoes_financeiras'
  ) THEN
    CREATE POLICY "Users can delete their own transacoes_financeiras"
      ON transacoes_financeiras FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
-- Todas as tabelas foram criadas com:
-- - Estrutura completa
-- - Índices para performance
-- - Triggers para updated_at
-- - Políticas RLS configuradas
-- ============================================

