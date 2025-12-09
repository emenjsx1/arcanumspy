-- ============================================
-- Tabela de Gerações de Copy
-- ============================================
CREATE TABLE IF NOT EXISTS copy_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nicho TEXT NOT NULL,
  tipo_criativo TEXT NOT NULL,
  modelo TEXT NOT NULL,
  publico TEXT NOT NULL,
  promessa TEXT NOT NULL,
  prova TEXT,
  diferencial TEXT NOT NULL,
  cta TEXT NOT NULL,
  resultado JSONB NOT NULL, -- Armazena copy principal, variações, headlines, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copy_generations_user_id ON copy_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_generations_created_at ON copy_generations(created_at DESC);

-- ============================================
-- RLS Policies para copy_generations
-- ============================================
ALTER TABLE copy_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own copy generations"
  ON copy_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own copy generations"
  ON copy_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own copy generations"
  ON copy_generations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own copy generations"
  ON copy_generations FOR DELETE
  USING (auth.uid() = user_id);

-- Admins podem ver todas as gerações
CREATE POLICY "Admins can view all copy generations"
  ON copy_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );












