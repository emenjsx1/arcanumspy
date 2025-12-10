# Configurar Variáveis de Ambiente no Vercel (Produção)

## ⚠️ IMPORTANTE
O domínio `arcanumspy.com` está tentando usar o Supabase, mas as variáveis de ambiente não estão configuradas no Vercel.

## 📋 Passo a Passo

### 1. Acessar o Painel do Vercel
1. Acesse: https://vercel.com
2. Faça login na sua conta
3. Selecione o projeto `acra` ou `arcanumspy`

### 2. Configurar Variáveis de Ambiente
1. No menu do projeto, clique em **Settings**
2. No menu lateral, clique em **Environment Variables**
3. Adicione as seguintes variáveis:

#### Variáveis Obrigatórias:

**NEXT_PUBLIC_SUPABASE_URL**
- **Value**: `https://seu-projeto.supabase.co`
- **Environment**: Production, Preview, Development (marque todos)
- **Description**: URL do seu projeto Supabase

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Value**: `sua-chave-anon-key`
- **Environment**: Production, Preview, Development (marque todos)
- **Description**: Chave anônima pública do Supabase

**SUPABASE_SERVICE_ROLE_KEY**
- **Value**: `sua-service-role-key`
- **Environment**: Production, Preview, Development (marque todos)
- **Description**: Chave de service role (apenas para server-side)

#### Variáveis Opcionais (se usar):

**OPENAI_API_KEY**
- **Value**: `sua-chave-openai`
- **Environment**: Production, Preview, Development

**FISH_AUDIO_API_KEY**
- **Value**: `sua-chave-fish-audio`
- **Environment**: Production, Preview, Development

**FISH_AUDIO_API_URL**
- **Value**: `https://api.fish.audio`
- **Environment**: Production, Preview, Development

**REMOVE_BG_API_KEY**
- **Value**: `sua-chave-remove-bg`
- **Environment**: Production, Preview, Development
- **Description**: Chave da API remove.bg para remoção de background de imagens
- **Onde obter**: https://www.remove.bg/api (criar conta e obter API key)

### 3. Onde Obter as Credenciais do Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ NUNCA exponha no cliente!)

### 4. Fazer Novo Deploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deployment
3. Selecione **Redeploy**
4. Ou faça um novo commit e push para trigger automático

### 5. Verificar se Funcionou

1. Acesse: https://arcanumspy.com
2. Tente criar uma conta
3. Verifique o console do navegador - não deve mais aparecer o erro de variáveis faltando

## 🔒 Segurança

- ✅ `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são públicas e podem ser expostas
- ❌ `SUPABASE_SERVICE_ROLE_KEY` é PRIVADA - nunca exponha no cliente!
- ✅ Use apenas `SUPABASE_SERVICE_ROLE_KEY` em API routes server-side

## 📝 Notas

- As variáveis `NEXT_PUBLIC_*` são expostas ao cliente (browser)
- As variáveis sem `NEXT_PUBLIC_` são apenas server-side
- Após adicionar variáveis, é necessário fazer um novo deploy
- Variáveis podem ser diferentes para Production, Preview e Development

## 🆘 Problemas Comuns

### Erro: "Missing Supabase environment variables"
- **Causa**: Variáveis não configuradas no Vercel
- **Solução**: Siga os passos acima

### Erro: "Failed to fetch" ou "ERR_NAME_NOT_RESOLVED"
- **Causa**: Variáveis configuradas incorretamente ou valores inválidos
- **Solução**: Verifique se copiou os valores corretos do Supabase

### Erro: "401 Unauthorized"
- **Causa**: Chave anônima incorreta ou expirada
- **Solução**: Verifique se a chave está correta no Supabase

## 📞 Suporte

Se continuar com problemas, verifique:
1. Logs do Vercel: https://vercel.com/seu-projeto/logs
2. Console do navegador (F12)
3. Configuração do Supabase: https://app.supabase.com/project/_/settings/api

