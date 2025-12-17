-- Tabela para armazenar copys geradas pelo Gerador de Copy de Criativo
CREATE TABLE IF NOT EXISTS copies_criativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  style TEXT NOT NULL, -- Estilo da copy (Agressivo, Neutro, Storytelling, etc.)
  creative_type TEXT NOT NULL, -- Tipo de criativo (Criativo curto, Script UGC, etc.)
  mechanism TEXT NOT NULL, -- Mecanismo do produto
  product_name TEXT NOT NULL, -- Nome do produto
  audience_age INTEGER NOT NULL, -- Idade do público
  pain TEXT, -- Dor do público (opcional)
  promise TEXT, -- Promessa (opcional)
  benefits TEXT, -- Benefícios (opcional)
  story TEXT, -- História resumida (opcional)
  description TEXT, -- Informações extras (opcional)
  headline TEXT NOT NULL, -- Headline gerada
  subheadline TEXT NOT NULL, -- Subheadline gerada
  body TEXT NOT NULL, -- Body (texto principal) gerado
  cta TEXT NOT NULL, -- CTA gerado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_copies_criativas_user_id ON copies_criativas(user_id);
CREATE INDEX IF NOT EXISTS idx_copies_criativas_created_at ON copies_criativas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copies_criativas_product_name ON copies_criativas(product_name);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_copies_criativas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_copies_criativas_updated_at ON copies_criativas;
CREATE TRIGGER trigger_update_copies_criativas_updated_at
  BEFORE UPDATE ON copies_criativas
  FOR EACH ROW
  EXECUTE FUNCTION update_copies_criativas_updated_at();

-- RLS (Row Level Security)
ALTER TABLE copies_criativas ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias copys
DROP POLICY IF EXISTS "Users can view their own copies" ON copies_criativas;
CREATE POLICY "Users can view their own copies"
  ON copies_criativas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários só podem inserir suas próprias copys
DROP POLICY IF EXISTS "Users can insert their own copies" ON copies_criativas;
CREATE POLICY "Users can insert their own copies"
  ON copies_criativas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem atualizar suas próprias copys
DROP POLICY IF EXISTS "Users can update their own copies" ON copies_criativas;
CREATE POLICY "Users can update their own copies"
  ON copies_criativas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem deletar suas próprias copys
DROP POLICY IF EXISTS "Users can delete their own copies" ON copies_criativas;
CREATE POLICY "Users can delete their own copies"
  ON copies_criativas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE copies_criativas IS 'Armazena copys geradas pelo Gerador de Copy de Criativo';
COMMENT ON COLUMN copies_criativas.style IS 'Estilo da copy (Agressivo, Neutro, Storytelling, etc.)';
COMMENT ON COLUMN copies_criativas.creative_type IS 'Tipo de criativo (Criativo curto, Script UGC, etc.)';







