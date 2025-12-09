-- ============================================
-- ADICIONAR CAMPO DE IMAGEM AOS POSTS DA COMUNIDADE
-- ============================================

-- Adicionar coluna image_url à tabela community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Criar índice para melhorar performance em buscas
CREATE INDEX IF NOT EXISTS idx_community_posts_image_url ON public.community_posts(image_url) WHERE image_url IS NOT NULL;




