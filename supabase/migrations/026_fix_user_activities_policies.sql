-- ============================================
-- FIX USER_ACTIVITIES POLICIES
-- Migration 026: Corrigir policies da tabela user_activities
-- ============================================

-- Verificar se a tabela existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_activities'
  ) THEN
    RAISE NOTICE 'Tabela user_activities não existe. Criando...';
    
    CREATE TABLE IF NOT EXISTS public.user_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- ex: OFFER_VIEW, CLICK, LOGIN, etc
      offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
      credits_used INTEGER DEFAULT 0,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(type);
    CREATE INDEX IF NOT EXISTS idx_user_activities_offer_id ON public.user_activities(offer_id);
  END IF;
END $$;

-- Remover policies antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Users can read their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON public.user_activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.user_activities;

-- Habilitar RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem inserir suas próprias atividades
CREATE POLICY "Users can insert their own activities"
  ON public.user_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem ler suas próprias atividades
CREATE POLICY "Users can read their own activities"
  ON public.user_activities
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins podem ver todas as atividades
CREATE POLICY "Admins can view all activities"
  ON public.user_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comentários
COMMENT ON TABLE public.user_activities IS 'Registra todas as atividades do usuário que consomem créditos ou são relevantes';
COMMENT ON COLUMN public.user_activities.type IS 'Tipo de atividade: OFFER_VIEW, CLICK, LOGIN, etc';



