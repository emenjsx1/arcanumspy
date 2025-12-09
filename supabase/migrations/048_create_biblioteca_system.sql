-- ============================================
-- SISTEMA DE BIBLIOTECA - PASTAS E ITENS
-- ============================================

-- Tabela de pastas da biblioteca
CREATE TABLE IF NOT EXISTS biblioteca_pastas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT, -- Cor da pasta (opcional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_biblioteca_pastas_user_id ON biblioteca_pastas(user_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_itens_pasta_id ON biblioteca_itens(pasta_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_itens_user_id ON biblioteca_itens(user_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_itens_tipo ON biblioteca_itens(tipo);
CREATE INDEX IF NOT EXISTS idx_biblioteca_itens_ordem ON biblioteca_itens(pasta_id, ordem);

-- RLS Policies
ALTER TABLE biblioteca_pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblioteca_itens ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias pastas
CREATE POLICY "Users can view their own folders"
  ON biblioteca_pastas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem criar suas próprias pastas
CREATE POLICY "Users can create their own folders"
  ON biblioteca_pastas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias pastas
CREATE POLICY "Users can update their own folders"
  ON biblioteca_pastas
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias pastas
CREATE POLICY "Users can delete their own folders"
  ON biblioteca_pastas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Política: Usuários só podem ver seus próprios itens
CREATE POLICY "Users can view their own items"
  ON biblioteca_itens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem criar seus próprios itens
CREATE POLICY "Users can create their own items"
  ON biblioteca_itens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios itens
CREATE POLICY "Users can update their own items"
  ON biblioteca_itens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios itens
CREATE POLICY "Users can delete their own items"
  ON biblioteca_itens
  FOR DELETE
  USING (auth.uid() = user_id);




