-- ============================================
-- ARCANUMSPY - SPOTIFY INTEGRATION
-- Tabela para armazenar tokens do Spotify
-- ============================================

-- Tabela de tokens do Spotify
CREATE TABLE IF NOT EXISTS spotify_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user_id ON spotify_tokens(user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_spotify_tokens_updated_at
  BEFORE UPDATE ON spotify_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só podem ver seus próprios tokens
DROP POLICY IF EXISTS "Users can view own spotify tokens" ON spotify_tokens;
CREATE POLICY "Users can view own spotify tokens"
  ON spotify_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários só podem inserir seus próprios tokens
DROP POLICY IF EXISTS "Users can insert own spotify tokens" ON spotify_tokens;
CREATE POLICY "Users can insert own spotify tokens"
  ON spotify_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários só podem atualizar seus próprios tokens
DROP POLICY IF EXISTS "Users can update own spotify tokens" ON spotify_tokens;
CREATE POLICY "Users can update own spotify tokens"
  ON spotify_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários só podem deletar seus próprios tokens
DROP POLICY IF EXISTS "Users can delete own spotify tokens" ON spotify_tokens;
CREATE POLICY "Users can delete own spotify tokens"
  ON spotify_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

