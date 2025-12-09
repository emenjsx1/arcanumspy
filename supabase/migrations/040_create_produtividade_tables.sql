-- ============================================
-- TABELAS DE PRODUTIVIDADE
-- ============================================
-- Inclui: tarefas, metas, anotacoes, pomodoros

-- ============================================
-- 1. TAREFAS TABLE
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

CREATE INDEX IF NOT EXISTS idx_tarefas_user_id ON tarefas(user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON tarefas(concluida);
CREATE INDEX IF NOT EXISTS idx_tarefas_created_at ON tarefas(created_at DESC);

-- ============================================
-- 2. METAS TABLE
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

-- ============================================
-- 3. ANOTACOES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  tags TEXT[], -- Array de tags
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anotacoes_user_id ON anotacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_created_at ON anotacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tags ON anotacoes USING GIN(tags);

-- ============================================
-- 4. POMODOROS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pomodoros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL, -- 'focus', 'shortBreak', 'longBreak'
  duration_seconds INTEGER NOT NULL, -- Duração configurada em segundos
  completed_seconds INTEGER NOT NULL DEFAULT 0, -- Tempo realmente completado
  completed BOOLEAN NOT NULL DEFAULT false, -- Se foi completado ou interrompido
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT, -- Notas opcionais sobre o pomodoro
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pomodoros_user_id ON pomodoros(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoros_mode ON pomodoros(mode);
CREATE INDEX IF NOT EXISTS idx_pomodoros_started_at ON pomodoros(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoros_completed ON pomodoros(completed);

-- ============================================
-- 5. POMODORO_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_minutes INTEGER NOT NULL DEFAULT 25,
  short_break_minutes INTEGER NOT NULL DEFAULT 5,
  long_break_minutes INTEGER NOT NULL DEFAULT 15,
  pomodoros_until_long_break INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_settings_user_id ON pomodoro_settings(user_id);

-- ============================================
-- 6. TRANSACOES_FINANCEIRAS TABLE
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

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON metas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anotacoes_updated_at BEFORE UPDATE ON anotacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pomodoro_settings_updated_at BEFORE UPDATE ON pomodoro_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacoes_financeiras_updated_at BEFORE UPDATE ON transacoes_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoros ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Tarefas: usuários só veem suas próprias tarefas
CREATE POLICY "Users can view their own tarefas"
  ON tarefas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tarefas"
  ON tarefas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tarefas"
  ON tarefas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tarefas"
  ON tarefas FOR DELETE
  USING (auth.uid() = user_id);

-- Metas: usuários só veem suas próprias metas
CREATE POLICY "Users can view their own metas"
  ON metas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metas"
  ON metas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metas"
  ON metas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metas"
  ON metas FOR DELETE
  USING (auth.uid() = user_id);

-- Anotações: usuários só veem suas próprias anotações
CREATE POLICY "Users can view their own anotacoes"
  ON anotacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anotacoes"
  ON anotacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anotacoes"
  ON anotacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anotacoes"
  ON anotacoes FOR DELETE
  USING (auth.uid() = user_id);

-- Pomodoros: usuários só veem seus próprios pomodoros
CREATE POLICY "Users can view their own pomodoros"
  ON pomodoros FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoros"
  ON pomodoros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoros"
  ON pomodoros FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pomodoros"
  ON pomodoros FOR DELETE
  USING (auth.uid() = user_id);

-- Configurações de Pomodoro: usuários só veem suas próprias configurações
CREATE POLICY "Users can view their own pomodoro_settings"
  ON pomodoro_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoro_settings"
  ON pomodoro_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro_settings"
  ON pomodoro_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pomodoro_settings"
  ON pomodoro_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Transações Financeiras: usuários só veem suas próprias transações
CREATE POLICY "Users can view their own transacoes_financeiras"
  ON transacoes_financeiras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transacoes_financeiras"
  ON transacoes_financeiras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transacoes_financeiras"
  ON transacoes_financeiras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transacoes_financeiras"
  ON transacoes_financeiras FOR DELETE
  USING (auth.uid() = user_id);

