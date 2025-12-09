-- ============================================
-- TABELA DE PROGRESSO DO USUÁRIO NAS AULAS
-- ============================================

CREATE TABLE IF NOT EXISTS user_aula_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  progresso_percentual INTEGER NOT NULL DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),
  tempo_assistido_segundos INTEGER NOT NULL DEFAULT 0,
  data_conclusao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, aula_id) -- Um usuário só pode ter um registro de progresso por aula
);

CREATE INDEX IF NOT EXISTS idx_user_aula_progress_user_id ON user_aula_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_aula_progress_aula_id ON user_aula_progress(aula_id);
CREATE INDEX IF NOT EXISTS idx_user_aula_progress_concluida ON user_aula_progress(concluida);

-- RLS Policies
ALTER TABLE user_aula_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seu próprio progresso
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_aula_progress' 
    AND policyname = 'Users can view own progress'
  ) THEN
    CREATE POLICY "Users can view own progress"
      ON user_aula_progress
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Usuários podem inserir seu próprio progresso
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_aula_progress' 
    AND policyname = 'Users can insert own progress'
  ) THEN
    CREATE POLICY "Users can insert own progress"
      ON user_aula_progress
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Usuários podem atualizar seu próprio progresso
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_aula_progress' 
    AND policyname = 'Users can update own progress'
  ) THEN
    CREATE POLICY "Users can update own progress"
      ON user_aula_progress
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 4. FUNÇÃO PARA ATUALIZAR updated_at (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGER PARA ATUALIZAR updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_user_aula_progress_updated_at ON user_aula_progress;
CREATE TRIGGER update_user_aula_progress_updated_at 
  BEFORE UPDATE ON user_aula_progress
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. FUNÇÃO PARA ATUALIZAR data_conclusao
-- ============================================
CREATE OR REPLACE FUNCTION update_aula_conclusao_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está sendo inserido e já vem como concluída
  IF TG_OP = 'INSERT' THEN
    IF NEW.concluida = true THEN
      NEW.data_conclusao = NOW();
    ELSE
      NEW.data_conclusao = NULL;
    END IF;
  -- Se está sendo atualizado
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.concluida = true AND (OLD.concluida = false OR OLD.concluida IS NULL) THEN
      NEW.data_conclusao = NOW();
    ELSIF NEW.concluida = false THEN
      NEW.data_conclusao = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGER PARA ATUALIZAR data_conclusao
-- ============================================
DROP TRIGGER IF EXISTS update_aula_conclusao_date_trigger ON user_aula_progress;
CREATE TRIGGER update_aula_conclusao_date_trigger
  BEFORE INSERT OR UPDATE ON user_aula_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_aula_conclusao_date();

-- ============================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================
COMMENT ON TABLE user_aula_progress IS 'Tabela que armazena o progresso dos usuários nas aulas';
COMMENT ON COLUMN user_aula_progress.concluida IS 'Indica se a aula foi completamente concluída pelo usuário';
COMMENT ON COLUMN user_aula_progress.progresso_percentual IS 'Percentual de progresso na aula (0-100)';
COMMENT ON COLUMN user_aula_progress.tempo_assistido_segundos IS 'Tempo total assistido da aula em segundos';
COMMENT ON COLUMN user_aula_progress.data_conclusao IS 'Data e hora em que a aula foi concluída (preenchida automaticamente)';

