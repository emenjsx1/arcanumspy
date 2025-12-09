-- ============================================
-- CALLS GRAVADAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS calls_gravadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  video_url TEXT NOT NULL,
  data_call DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_calls_gravadas_data_call ON calls_gravadas(data_call DESC);
CREATE INDEX IF NOT EXISTS idx_calls_gravadas_is_active ON calls_gravadas(is_active);
CREATE INDEX IF NOT EXISTS idx_calls_gravadas_created_at ON calls_gravadas(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calls_gravadas_updated_at
  BEFORE UPDATE ON calls_gravadas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE calls_gravadas ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver calls ativas
CREATE POLICY "Usuários autenticados podem ver calls ativas"
  ON calls_gravadas
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Política: Apenas admins podem inserir calls
CREATE POLICY "Apenas admins podem inserir calls"
  ON calls_gravadas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Apenas admins podem atualizar calls
CREATE POLICY "Apenas admins podem atualizar calls"
  ON calls_gravadas
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Apenas admins podem deletar calls
CREATE POLICY "Apenas admins podem deletar calls"
  ON calls_gravadas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


