-- ============================================
-- TABELA DE HISTÓRICO DO ESPIÃO DE DOMÍNIOS
-- ============================================

CREATE TABLE IF NOT EXISTS espiao_dominios_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dominio TEXT NOT NULL,
  urls_encontradas JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_espiao_dominios_user_id ON espiao_dominios_historico(user_id);
CREATE INDEX IF NOT EXISTS idx_espiao_dominios_created_at ON espiao_dominios_historico(created_at DESC);

-- RLS Policies
ALTER TABLE espiao_dominios_historico ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'espiao_dominios_historico' 
    AND policyname = 'Users can view own domain spy history'
  ) THEN
    CREATE POLICY "Users can view own domain spy history"
      ON espiao_dominios_historico
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can insert their own history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'espiao_dominios_historico' 
    AND policyname = 'Users can insert own domain spy history'
  ) THEN
    CREATE POLICY "Users can insert own domain spy history"
      ON espiao_dominios_historico
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can delete their own history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'espiao_dominios_historico' 
    AND policyname = 'Users can delete own domain spy history'
  ) THEN
    CREATE POLICY "Users can delete own domain spy history"
      ON espiao_dominios_historico
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger para updated_at (se necessário no futuro)
-- Por enquanto não é necessário, mas podemos adicionar se precisar


