-- ============================================
-- TABELAS DE POSTS, COMENTÁRIOS E REAÇÕES DA COMUNIDADE
-- ============================================

-- ============================================
-- 1. COMMUNITY_POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- 'geral', 'dicas', 'duvidas', 'sucessos', 'anuncios'
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  reactions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON public.community_posts(is_pinned);

-- ============================================
-- 2. COMMUNITY_POST_COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE, -- Para threads
  content TEXT NOT NULL,
  reactions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_user_id ON public.community_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_parent_id ON public.community_post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_created_at ON public.community_post_comments(created_at DESC);

-- ============================================
-- 3. COMMUNITY_POST_REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like', -- 'like', 'love', 'useful', 'helpful'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type), -- Um usuário pode ter apenas uma reação do mesmo tipo por post
  UNIQUE(comment_id, user_id, reaction_type), -- Um usuário pode ter apenas uma reação do mesmo tipo por comentário
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  ) -- Deve reagir a um post OU um comentário, não ambos
);

CREATE INDEX IF NOT EXISTS idx_community_post_reactions_post_id ON public.community_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_reactions_comment_id ON public.community_post_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_post_reactions_user_id ON public.community_post_reactions(user_id);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;

-- Policies para community_posts
DO $$ 
BEGIN
  -- Qualquer um pode ver posts de comunidades ativas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_posts' 
    AND policyname = 'Anyone can view posts from active communities'
  ) THEN
    CREATE POLICY "Anyone can view posts from active communities"
      ON public.community_posts
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.communities
          WHERE communities.id = community_posts.community_id
          AND communities.is_active = true
        )
      );
  END IF;

  -- Usuários podem criar posts em comunidades que são membros
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_posts' 
    AND policyname = 'Users can create posts in communities they joined'
  ) THEN
    CREATE POLICY "Users can create posts in communities they joined"
      ON public.community_posts
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM public.community_members
          WHERE community_members.user_id = auth.uid()
          AND community_members.community_id = community_posts.community_id
        )
      );
  END IF;

  -- Usuários podem editar seus próprios posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_posts' 
    AND policyname = 'Users can update their own posts'
  ) THEN
    CREATE POLICY "Users can update their own posts"
      ON public.community_posts
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- Usuários podem deletar seus próprios posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_posts' 
    AND policyname = 'Users can delete their own posts'
  ) THEN
    CREATE POLICY "Users can delete their own posts"
      ON public.community_posts
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies para community_post_comments
DO $$ 
BEGIN
  -- Qualquer um pode ver comentários de posts visíveis
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_post_comments' 
    AND policyname = 'Anyone can view comments from visible posts'
  ) THEN
    CREATE POLICY "Anyone can view comments from visible posts"
      ON public.community_post_comments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.community_posts
          JOIN public.communities ON communities.id = community_posts.community_id
          WHERE community_posts.id = community_post_comments.post_id
          AND communities.is_active = true
        )
      );
  END IF;

  -- Usuários podem criar comentários em posts de comunidades que são membros
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_post_comments' 
    AND policyname = 'Users can create comments in communities they joined'
  ) THEN
    CREATE POLICY "Users can create comments in communities they joined"
      ON public.community_post_comments
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM public.community_posts
          JOIN public.community_members ON community_members.community_id = community_posts.community_id
          WHERE community_posts.id = community_post_comments.post_id
          AND community_members.user_id = auth.uid()
        )
      );
  END IF;

  -- Usuários podem editar seus próprios comentários
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_post_comments' 
    AND policyname = 'Users can update their own comments'
  ) THEN
    CREATE POLICY "Users can update their own comments"
      ON public.community_post_comments
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- Usuários podem deletar seus próprios comentários
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_post_comments' 
    AND policyname = 'Users can delete their own comments'
  ) THEN
    CREATE POLICY "Users can delete their own comments"
      ON public.community_post_comments
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies para community_post_reactions
DO $$ 
BEGIN
  -- Qualquer um pode ver reações
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_post_reactions' 
    AND policyname = 'Anyone can view reactions'
  ) THEN
    CREATE POLICY "Anyone can view reactions"
      ON public.community_post_reactions
      FOR SELECT
      USING (true);
  END IF;

  -- Usuários podem criar reações
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_post_reactions' 
    AND policyname = 'Users can create reactions'
  ) THEN
    CREATE POLICY "Users can create reactions"
      ON public.community_post_reactions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Usuários podem deletar suas próprias reações
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_post_reactions' 
    AND policyname = 'Users can delete their own reactions'
  ) THEN
    CREATE POLICY "Users can delete their own reactions"
      ON public.community_post_reactions
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 5. TRIGGERS PARA ATUALIZAR CONTADORES
-- ============================================

-- Função para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para comentários
DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON public.community_post_comments;
CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON public.community_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Função para atualizar contador de reações
CREATE OR REPLACE FUNCTION update_post_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.community_posts
      SET reactions_count = reactions_count + 1
      WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE public.community_post_comments
      SET reactions_count = reactions_count + 1
      WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.community_posts
      SET reactions_count = GREATEST(reactions_count - 1, 0)
      WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE public.community_post_comments
      SET reactions_count = GREATEST(reactions_count - 1, 0)
      WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para reações
DROP TRIGGER IF EXISTS update_post_reactions_count_trigger ON public.community_post_reactions;
CREATE TRIGGER update_post_reactions_count_trigger
  AFTER INSERT OR DELETE ON public.community_post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reactions_count();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_community_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_community_posts_updated_at_trigger ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at_trigger
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_community_posts_updated_at();

DROP TRIGGER IF EXISTS update_community_post_comments_updated_at_trigger ON public.community_post_comments;
CREATE TRIGGER update_community_post_comments_updated_at_trigger
  BEFORE UPDATE ON public.community_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_community_posts_updated_at();


