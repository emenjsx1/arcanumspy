# 🔧 Como Configurar Variáveis de Ambiente no Vercel

## ⚠️ Erro: "Environment Variable references Secret which does not exist"

Este erro ocorre quando o `vercel.json` referencia secrets que não foram criados no Vercel.

## ✅ Solução: Configurar Variáveis de Ambiente no Painel do Vercel

### Passo 1: Acessar o Painel do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar Variáveis de Ambiente

Adicione as seguintes variáveis **uma por uma**:

#### Variáveis do Supabase (Obrigatórias)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vahqjpblgirjbhglsiqm.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `sua_service_role_key` | Production, Preview, Development |

**Onde encontrar no Supabase:**
- Settings → API → Project URL
- Settings → API → anon/public key
- Settings → API → service_role key (⚠️ SECRETO)

#### Variáveis do Fish Audio (Obrigatórias)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `FISH_AUDIO_API_KEY` | `7c0f58472b724703abc385164af007b5` | Production, Preview, Development |
| `FISH_AUDIO_API_URL` | `https://api.fish.audio` | Production, Preview, Development |

#### Variáveis do OpenAI (Opcional)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `OPENAI_API_KEY` | `sua_openai_api_key` | Production, Preview, Development |

#### Variáveis do Remove.bg (Opcional - para remoção de background)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `REMOVE_BG_API_KEY` | `sua_remove_bg_api_key` | Production, Preview, Development |

**Onde encontrar:**
- Acesse: https://www.remove.bg/api
- Crie uma conta gratuita
- Obtenha sua API key no painel

### Passo 3: Configurar via CLI (Alternativa)

Se preferir usar a CLI do Vercel:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Adicionar variáveis (será solicitado o valor)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add FISH_AUDIO_API_KEY production
vercel env add FISH_AUDIO_API_URL production
vercel env add OPENAI_API_KEY production

# Repetir para preview e development se necessário
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
# ... etc
```

### Passo 4: Fazer Novo Deploy

Após adicionar todas as variáveis:

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Selecione **Redeploy**
4. Ou faça um novo commit e push

## 🔍 Verificar se Está Funcionando

Após o deploy, verifique:

1. ✅ Build completa sem erros
2. ✅ Aplicação carrega corretamente
3. ✅ Autenticação funciona
4. ✅ APIs respondem corretamente

## 📝 Notas Importantes

- ⚠️ **NUNCA** commite valores de secrets no código
- ✅ O arquivo `vercel.json` foi atualizado para não referenciar secrets
- ✅ Configure as variáveis diretamente no painel do Vercel
- ✅ Variáveis `NEXT_PUBLIC_*` são expostas ao frontend
- ✅ Service Role Keys devem ser mantidas secretas

## 🆘 Problemas Comuns

### Erro: "Secret does not exist"
- **Solução**: Remova as referências a `@secret` do `vercel.json` e configure variáveis de ambiente normais no painel

### Variáveis não aparecem no build
- **Solução**: Certifique-se de selecionar os ambientes corretos (Production, Preview, Development)
- **Solução**: Faça um novo deploy após adicionar variáveis

### Build falha mesmo com variáveis configuradas
- **Solução**: Verifique se os nomes das variáveis estão exatamente corretos (case-sensitive)
- **Solução**: Verifique se os valores estão corretos (sem espaços extras)

