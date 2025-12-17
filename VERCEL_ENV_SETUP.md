# 🔧 Configuração de Variáveis de Ambiente no Vercel

Este documento explica como configurar as variáveis de ambiente necessárias para fazer o deploy do projeto no Vercel.

## 📋 Variáveis de Ambiente Obrigatórias

Configure as seguintes variáveis de ambiente no painel do Vercel:

### 1. Supabase (Obrigatórias)

```
NEXT_PUBLIC_SUPABASE_URL=https://vahqjpblgirjbhglsiqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaHFqcGJsZ2lyamJoZ2xzaXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTI2MzcsImV4cCI6MjA3OTQyODYzN30.hQ-BjXpzNAQYYbfhx87KYU_ICgAVstHQMyymPXBY6Rk
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**Onde encontrar:**
- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase (Settings > API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase (Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase (Settings > API > service_role key) ⚠️ **MANTENHA SECRETO**

### 2. Fish Audio API (Obrigatórias)

```
FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5
FISH_AUDIO_API_URL=https://api.fish.audio
```

**Onde encontrar:**
- `FISH_AUDIO_API_KEY`: Sua chave de API do Fish Audio
- `FISH_AUDIO_API_URL`: URL base da API (geralmente `https://api.fish.audio`)

### 3. OpenAI API (Opcional - se usar funcionalidades de IA)

```
OPENAI_API_KEY=sua_openai_api_key_aqui
```

**Onde encontrar:**
- Obtenha sua chave em: https://platform.openai.com/api-keys
- ⚠️ **MANTENHA SECRETO** - nunca exponha no frontend

## 🚀 Como Configurar no Vercel

### Método 1: Via Painel Web do Vercel

1. Acesse seu projeto no Vercel: https://vercel.com/dashboard
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável uma por uma:
   - **Name**: Nome da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Selecione `Production`, `Preview` e `Development` conforme necessário
4. Clique em **Save**
5. Após adicionar todas as variáveis, faça um novo deploy

### Método 2: Via CLI do Vercel

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Adicionar variáveis de ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add FISH_AUDIO_API_KEY
vercel env add FISH_AUDIO_API_URL
vercel env add OPENAI_API_KEY
```

## ⚠️ Importante

1. **Variáveis `NEXT_PUBLIC_*`**: São expostas ao frontend. Use apenas para dados públicos.
2. **Service Role Keys e API Keys**: NUNCA devem ter o prefixo `NEXT_PUBLIC_` - elas são server-side apenas.
3. **Após adicionar variáveis**: Você precisa fazer um novo deploy para que as mudanças tenham efeito.
4. **Ambientes diferentes**: Configure valores diferentes para Production, Preview e Development se necessário.

## ✅ Verificação

Após configurar as variáveis e fazer o deploy, verifique:

1. O build deve completar sem erros
2. As rotas de API devem funcionar corretamente
3. A autenticação com Supabase deve funcionar
4. As funcionalidades que dependem de APIs externas devem funcionar

## 🔒 Segurança

- ⚠️ **NUNCA** commite arquivos `.env.local` ou `.env` no Git
- ⚠️ **NUNCA** exponha Service Role Keys ou API Keys no frontend
- ⚠️ Use variáveis de ambiente do Vercel para todos os secrets
- ✅ O arquivo `.gitignore` já está configurado para ignorar arquivos `.env*`

## 📝 Notas

- As variáveis de ambiente são carregadas automaticamente pelo Next.js durante o build
- Variáveis `NEXT_PUBLIC_*` são incluídas no bundle do cliente
- Variáveis sem `NEXT_PUBLIC_` são apenas server-side e não são expostas ao cliente







