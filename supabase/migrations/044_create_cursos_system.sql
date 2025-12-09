-- ============================================
-- SISTEMA DE CURSOS, MÓDULOS E AULAS
-- ============================================

-- ============================================
-- 1. CURSOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cursos_ordem ON cursos(ordem);
CREATE INDEX IF NOT EXISTS idx_cursos_is_active ON cursos(is_active);
CREATE INDEX IF NOT EXISTS idx_cursos_created_at ON cursos(created_at DESC);

-- ============================================
-- 2. MODULOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modulos_curso_id ON modulos(curso_id);
CREATE INDEX IF NOT EXISTS idx_modulos_ordem ON modulos(curso_id, ordem);
CREATE INDEX IF NOT EXISTS idx_modulos_is_active ON modulos(is_active);

-- ============================================
-- 3. AULAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  video_url TEXT NOT NULL,
  duracao_minutos INTEGER,
  ordem INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aulas_modulo_id ON aulas(modulo_id);
CREATE INDEX IF NOT EXISTS idx_aulas_ordem ON aulas(modulo_id, ordem);
CREATE INDEX IF NOT EXISTS idx_aulas_is_active ON aulas(is_active);

-- ============================================
-- 4. TRIGGERS PARA updated_at
-- ============================================
-- Trigger para cursos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_cursos_updated_at ON cursos;
    CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger para modulos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_modulos_updated_at ON modulos;
    CREATE TRIGGER update_modulos_updated_at BEFORE UPDATE ON modulos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger para aulas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_aulas_updated_at ON aulas;
    CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON aulas
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 5. RLS POLICIES - CURSOS
-- ============================================
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem visualizar cursos ativos
CREATE POLICY "Anyone can view active cursos"
  ON cursos FOR SELECT
  USING (is_active = true);

-- Política: Admins podem ver todos os cursos
CREATE POLICY "Admins can view all cursos"
  ON cursos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem inserir cursos
CREATE POLICY "Admins can insert cursos"
  ON cursos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem atualizar cursos
CREATE POLICY "Admins can update cursos"
  ON cursos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem deletar cursos
CREATE POLICY "Admins can delete cursos"
  ON cursos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6. RLS POLICIES - MODULOS
-- ============================================
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem visualizar módulos de cursos ativos
CREATE POLICY "Users can view modulos from active cursos"
  ON modulos FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM cursos
      WHERE cursos.id = modulos.curso_id
      AND cursos.is_active = true
    )
  );

-- Política: Admins podem ver todos os módulos
CREATE POLICY "Admins can view all modulos"
  ON modulos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem inserir módulos
CREATE POLICY "Admins can insert modulos"
  ON modulos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem atualizar módulos
CREATE POLICY "Admins can update modulos"
  ON modulos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem deletar módulos
CREATE POLICY "Admins can delete modulos"
  ON modulos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 7. RLS POLICIES - AULAS
-- ============================================
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem visualizar aulas de módulos ativos
CREATE POLICY "Users can view aulas from active modulos"
  ON aulas FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM modulos
      WHERE modulos.id = aulas.modulo_id
      AND modulos.is_active = true
      AND EXISTS (
        SELECT 1 FROM cursos
        WHERE cursos.id = modulos.curso_id
        AND cursos.is_active = true
      )
    )
  );

-- Política: Admins podem ver todas as aulas
CREATE POLICY "Admins can view all aulas"
  ON aulas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem inserir aulas
CREATE POLICY "Admins can insert aulas"
  ON aulas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem atualizar aulas
CREATE POLICY "Admins can update aulas"
  ON aulas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins podem deletar aulas
CREATE POLICY "Admins can delete aulas"
  ON aulas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );





