# 🔧 Solução para Erros do Admin Dashboard

## ❌ Problemas Identificados

1. **Erro 401 (Unauthorized)** em `/api/admin/stats`
2. **Erro 500 (Internal Server Error)** na tabela `user_activities`
3. **Erro: Missing SUPABASE_SERVICE_ROLE_KEY** em `getRecentUsers`

## ✅ Correções Implementadas

### 1. Tratamento de Erro 500 em `user_activities`

**Arquivo:** `src/lib/db/dashboard.ts`

- Adicionado tratamento robusto de erros na função `getRecentActivities`
- Agora usa fallback automaticamente quando há erro 500 ou problemas de RLS
- Não quebra mais a página quando a tabela tem problemas

### 2. Melhor Tratamento de Autenticação na Rota de Stats

**Arquivo:** `src/app/api/admin/stats/route.ts`

- Adicionados logs detalhados para debug
- Mensagens de erro mais específicas
- Melhor tratamento quando a sessão não é encontrada

### 3. Script SQL para Corrigir Policies

**Arquivo:** `supabase/migrations/026_fix_user_activities_policies.sql`

- Remove policies antigas que podem estar causando conflito
- Cria policies corretas para a tabela `user_activities`
- Garante que admins podem ver todas as atividades

## 🚀 Próximos Passos

### 1. Executar a Migration SQL

Execute a migration no Supabase para corrigir as policies:

```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: supabase/migrations/026_fix_user_activities_policies.sql
```

Ou via CLI:
```bash
supabase db push
```

### 2. Configurar SUPABASE_SERVICE_ROLE_KEY

**IMPORTANTE:** Adicione a variável no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**Como obter:**
1. Acesse: https://app.supabase.com/project/vahqjpblgirjbhglsiqm/settings/api
2. Copie a **Service Role Key** (secret key)
3. Adicione no `.env.local`

### 3. Reiniciar o Servidor

**CRÍTICO:** Após adicionar a variável, reinicie o servidor:

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

## 🔍 Verificações

### Verificar se a Tabela Existe

Execute no SQL Editor do Supabase:

```sql
SELECT * FROM user_activities LIMIT 10;
```

Se der erro, execute a migration `026_fix_user_activities_policies.sql`.

### Verificar Policies

Execute no SQL Editor:

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_activities';
```

Deve mostrar 3 policies:
1. `Users can insert their own activities`
2. `Users can read their own activities`
3. `Admins can view all activities`

### Verificar Variável de Ambiente

No terminal do servidor, verifique se a variável está carregada:

```bash
# No terminal onde roda o servidor, não deve aparecer erro sobre SUPABASE_SERVICE_ROLE_KEY
```

## 📝 Checklist

- [ ] Executar migration `026_fix_user_activities_policies.sql` no Supabase
- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- [ ] **REINICIAR** o servidor Next.js
- [ ] Fazer login novamente
- [ ] Testar acessar `/admin/dashboard`
- [ ] Verificar se os erros desapareceram do console

## 🐛 Se Ainda Houver Problemas

### Erro 401 Persistente

1. **Limpe os cookies do navegador**
2. **Faça login novamente**
3. **Verifique se está acessando como admin**

### Erro 500 Persistente

1. **Execute a migration SQL manualmente**
2. **Verifique se a tabela `user_activities` existe**
3. **Verifique se as policies foram criadas corretamente**

### Erro de SUPABASE_SERVICE_ROLE_KEY

1. **Verifique se adicionou no `.env.local`** (não `.env`)
2. **Verifique se não há espaços extras na key**
3. **Certifique-se de que o servidor foi REINICIADO**

## 📚 Arquivos Modificados

- ✅ `src/lib/db/dashboard.ts` - Tratamento de erro 500
- ✅ `src/app/api/admin/stats/route.ts` - Melhor autenticação
- ✅ `supabase/migrations/026_fix_user_activities_policies.sql` - Correção de policies



