-- Tabela para armazenar transcrições de áudio
CREATE TABLE IF NOT EXISTS transcricoes_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  texto_transcrito TEXT,
  confianca DECIMAL(5, 4), -- 0.0000 a 1.0000
  duracao DECIMAL(10, 2), -- Duração em segundos
  idioma VARCHAR(10) DEFAULT 'pt-BR',
  modelo VARCHAR(50) DEFAULT 'nova-2',
  status VARCHAR(20) DEFAULT 'processando', -- processando, concluido, erro
  palavras_count INTEGER DEFAULT 0,
  palavras JSONB, -- Array de palavras com timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transcricoes_audio_user_id ON transcricoes_audio(user_id);
CREATE INDEX IF NOT EXISTS idx_transcricoes_audio_created_at ON transcricoes_audio(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcricoes_audio_status ON transcricoes_audio(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_transcricoes_audio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_transcricoes_audio_updated_at ON transcricoes_audio;
CREATE TRIGGER trigger_update_transcricoes_audio_updated_at
  BEFORE UPDATE ON transcricoes_audio
  FOR EACH ROW
  EXECUTE FUNCTION update_transcricoes_audio_updated_at();

-- RLS (Row Level Security)
ALTER TABLE transcricoes_audio ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias transcrições
DROP POLICY IF EXISTS "Users can view their own transcriptions" ON transcricoes_audio;
CREATE POLICY "Users can view their own transcriptions"
  ON transcricoes_audio
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários só podem inserir suas próprias transcrições
DROP POLICY IF EXISTS "Users can insert their own transcriptions" ON transcricoes_audio;
CREATE POLICY "Users can insert their own transcriptions"
  ON transcricoes_audio
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem atualizar suas próprias transcrições
DROP POLICY IF EXISTS "Users can update their own transcriptions" ON transcricoes_audio;
CREATE POLICY "Users can update their own transcriptions"
  ON transcricoes_audio
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem deletar suas próprias transcrições
DROP POLICY IF EXISTS "Users can delete their own transcriptions" ON transcricoes_audio;
CREATE POLICY "Users can delete their own transcriptions"
  ON transcricoes_audio
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE transcricoes_audio IS 'Armazena transcrições de áudio feitas pelos usuários usando Deepgram';
COMMENT ON COLUMN transcricoes_audio.confianca IS 'Nível de confiança da transcrição (0.0 a 1.0)';
COMMENT ON COLUMN transcricoes_audio.palavras IS 'Array JSON com palavras, timestamps e confiança individual';
COMMENT ON COLUMN transcricoes_audio.modelo IS 'Modelo do Deepgram usado (nova-2, nova, base)';

