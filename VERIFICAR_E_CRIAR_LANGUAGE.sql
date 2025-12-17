-- ============================================
-- VERIFICAR E CRIAR COLUNA LANGUAGE SE NECESSÁRIO
-- ============================================

-- Verificar se a coluna language existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'offers' 
        AND column_name = 'language'
    ) THEN
        -- Criar a coluna se não existir
        ALTER TABLE offers 
        ADD COLUMN language TEXT;
        
        -- Comentário
        COMMENT ON COLUMN offers.language IS 'Idioma da oferta (pt, en, es, etc.)';
        
        -- Criar índice para melhor performance nas buscas
        CREATE INDEX IF NOT EXISTS idx_offers_language ON offers(language);
        
        RAISE NOTICE 'Coluna language criada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna language já existe!';
    END IF;
END $$;

-- Verificar se a coluna image_url existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'offers' 
        AND column_name = 'image_url'
    ) THEN
        -- Criar a coluna se não existir
        ALTER TABLE offers 
        ADD COLUMN image_url TEXT;
        
        -- Comentário
        COMMENT ON COLUMN offers.image_url IS 'URL da imagem principal da oferta';
        
        -- Criar índice para melhor performance nas buscas
        CREATE INDEX IF NOT EXISTS idx_offers_image_url ON offers(image_url);
        
        RAISE NOTICE 'Coluna image_url criada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna image_url já existe!';
    END IF;
END $$;

-- Listar todas as colunas da tabela offers para verificação
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'offers' 
ORDER BY ordinal_position;







