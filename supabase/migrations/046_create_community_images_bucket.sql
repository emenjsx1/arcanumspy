-- ============================================
-- CRIAR BUCKET PARA IMAGENS DA COMUNIDADE
-- ============================================

-- Criar bucket para imagens da comunidade
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens por usuários autenticados
-- O caminho deve ser: {user_id}/{community_id}/{filename}
CREATE POLICY IF NOT EXISTS "Usuários autenticados podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política alternativa mais permissiva para uploads
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de imagens" ON storage.objects;
CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-images');

-- Política para permitir leitura pública de imagens
CREATE POLICY IF NOT EXISTS "Imagens da comunidade são públicas"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-images');

-- Política para permitir que usuários deletem suas próprias imagens
CREATE POLICY IF NOT EXISTS "Usuários podem deletar suas próprias imagens"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

