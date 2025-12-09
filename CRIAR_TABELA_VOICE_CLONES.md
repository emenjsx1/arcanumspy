# 🗄️ Como Criar a Tabela voice_clones no Supabase

## ⚠️ Problema

O erro `Could not find the table 'public.voice_clones' in the schema cache` significa que a tabela `voice_clones` não existe no banco de dados.

## ✅ Solução

Execute a migration SQL no Supabase para criar a tabela.

## 📝 Passo a Passo

### 1. Acessar o SQL Editor do Supabase

1. Vá para [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New query**

### 2. Copiar e Executar a Migration

Copie o conteúdo do arquivo `supabase/migrations/004_voice_cloning.sql` e cole no SQL Editor do Supabase.

Ou execute este SQL diretamente:

```sql
-- Habilitar extensão UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela voice_clones
CREATE TABLE IF NOT EXISTS voice_clones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL, -- ID gerado localmente para identificação
  name TEXT NOT NULL,image.png olha desigb ai 
  
  description TEXT,
  audio_url TEXT, -- URL do áudio no Supabase Storage
  status TEXT NOT NULL DEFAULT 'ready', -- 'processing', 'ready', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar tabela voice_audio_generations (para cache de TTS)
CREATE TABLE IF NOT EXISTS voice_audio_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_clone_id UUID NOT NULL REFERENCES voice_clones(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  text_hash TEXT NOT NULL, -- Hash do texto para cache
  audio_url TEXT NOT NULL, -- URL do áudio gerado no Supabase Storage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(voice_clone_id, text_hash) -- Evitar gerações duplicadas
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_voice_clones_user_id ON voice_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_clones_voice_id ON voice_clones(voice_id);
CREATE INDEX IF NOT EXISTS idx_voice_audio_generations_voice_clone_id ON voice_audio_generations(voice_clone_id);
CREATE INDEX IF NOT EXISTS idx_voice_audio_generations_text_hash ON voice_audio_generations(text_hash);
CREATE INDEX IF NOT EXISTS idx_voice_audio_generations_user_id ON voice_audio_generations(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_audio_generations ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias vozes
CREATE POLICY "Users can view their own voice clones"
ON voice_clones FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política: Usuários podem criar suas próprias vozes
CREATE POLICY "Users can create their own voice clones"
ON voice_clones FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias vozes
CREATE POLICY "Users can update their own voice clones"
ON voice_clones FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias vozes
CREATE POLICY "Users can delete their own voice clones"
ON voice_clones FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Política: Usuários podem ver apenas suas próprias gerações de áudio
CREATE POLICY "Users can view their own audio generations"
ON voice_audio_generations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política: Usuários podem criar suas próprias gerações de áudio
CREATE POLICY "Users can create their own audio generations"
ON voice_audio_generations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_voice_clones_updated_at BEFORE UPDATE
ON voice_clones FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 3. Executar a Query

1. Clique no botão **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
2. Aguarde a execução completar
3. Você deve ver mensagens de sucesso como:
   - ✅ `CREATE TABLE`
   - ✅ `CREATE INDEX`
   - ✅ `CREATE POLICY`
   - ✅ `CREATE FUNCTION`
   - ✅ `CREATE TRIGGER`

### 4. Verificar

Para verificar se as tabelas foram criadas:

1. No Supabase Dashboard, vá em **Table Editor**
2. Você deve ver as tabelas:
   - ✅ `voice_clones`
   - ✅ `voice_audio_generations`

### 5. Testar Novamente

Após criar as tabelas, tente fazer upload de áudio novamente. O erro deve desaparecer!

## ✅ Checklist

- [ ] Tabela `voice_clones` criada
- [ ] Tabela `voice_audio_generations` criada
- [ ] Índices criados
- [ ] Políticas RLS configuradas
- [ ] Trigger de `updated_at` configurado
- [ ] Bucket `voice-clones` criado no Storage

## 🆘 Se Ainda Der Erro

Se ainda der erro após executar o SQL:

1. Verifique se você está no projeto correto do Supabase
2. Verifique se a query foi executada com sucesso (não deve ter erros vermelhos)
3. Recarregue a página da aplicação
4. Tente fazer upload novamente

**Depois de executar o SQL, teste novamente!** 🚀

