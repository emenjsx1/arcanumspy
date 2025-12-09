-- ============================================
-- ATUALIZAR POLÍTICA RLS PARA PERMITIR POSTS DE USUÁRIOS AUTENTICADOS
-- ============================================

-- Remover política antiga que exigia ser membro
DROP POLICY IF EXISTS "Users can create posts in communities they joined" ON public.community_posts;

-- Criar nova política que permite qualquer usuário autenticado criar posts
CREATE POLICY "Authenticated users can create posts in active communities"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_posts.community_id
      AND communities.is_active = true
    )
  );

-- Atualizar política de comentários também para ser mais permissiva
DROP POLICY IF EXISTS "Users can create comments in communities they joined" ON public.community_post_comments;

CREATE POLICY "Authenticated users can create comments in active communities"
  ON public.community_post_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.community_posts
      JOIN public.communities ON communities.id = community_posts.community_id
      WHERE community_posts.id = community_post_comments.post_id
      AND communities.is_active = true
    )
  );




