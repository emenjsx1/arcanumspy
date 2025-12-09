# Resumo das Correções dos Logs

## Problemas Identificados e Soluções

### 1. ✅ Recursão Infinita na Política RLS (Erro 500 - código 42P17)
**Problema**: A função `is_admin()` fazia SELECT na tabela `profiles`, mas a política "Admins can view all profiles" também usava `is_admin()`, causando recursão infinita.

**Solução**: Criada migração `012_fix_rls_recursion_profiles.sql` que:
- Cria função `get_current_user_role()` com `SECURITY DEFINER` que lê diretamente da tabela sem passar por RLS
- Recria `is_admin()` usando a função auxiliar
- Atualiza as políticas para usar `get_current_user_role()` diretamente, evitando recursão

**Arquivo**: `supabase/migrations/012_fix_rls_recursion_profiles.sql`

### 2. ✅ Referências à Tabela `niches` que Não Existe (Erro 400)
**Problema**: Várias queries tentavam fazer join com a tabela `niches` que não existe no schema. O campo `niche` na tabela `offers` é apenas TEXT, não uma foreign key.

**Solução**: Removidas todas as referências a `niche:niches(...)` das queries em:
- `src/lib/db/offers.ts` (funções `getOffers`, `getOfferById`, `getHotOffers`, `getRecentOffers`)
- `src/lib/db/dashboard.ts` (função `getRecommendedOffers`)
- `src/lib/db/admin/offers.ts` (função `getTopOffers`)

**Arquivos modificados**:
- `src/lib/db/offers.ts`
- `src/lib/db/dashboard.ts`
- `src/lib/db/admin/offers.ts`

### 3. ⚠️ Tabela `user_activities` Não Existe (Erro 404)
**Problema**: O código tenta buscar da tabela `user_activities` que não existe no schema.

**Status**: O código já tem tratamento de erro que busca de outras fontes quando a tabela não existe. A referência está em `src/lib/db/dashboard.ts` linha 263 e já tem fallback implementado.

**Ação necessária**: Nenhuma - o código já trata o erro graciosamente.

### 4. ⚠️ Queries de Profiles com Subscriptions (Erro 400)
**Problema**: Algumas queries de profiles com joins de subscriptions estão falhando.

**Status**: As queries parecem corretas. O problema pode estar relacionado às políticas RLS que foram corrigidas na migração 012. Após aplicar a migração, essas queries devem funcionar.

**Arquivos afetados**:
- `src/lib/db/admin/users.ts` (funções `getAllUsers`, `getRecentUsers`)

### 5. ⚠️ Erros de Extensão do Navegador
**Problema**: Vários erros de "runtime.lastError" relacionados a extensões do Chrome.

**Status**: Não são erros do código - são avisos de extensões do navegador. Podem ser ignorados.

## Próximos Passos

1. **Aplicar a migração 012** no Supabase para corrigir a recursão infinita:
   ```sql
   -- Executar o arquivo supabase/migrations/012_fix_rls_recursion_profiles.sql
   ```

2. **Testar as queries** após aplicar a migração para verificar se os erros 500 e 400 foram resolvidos.

3. **Verificar se há outras queries** que ainda referenciam tabelas inexistentes.

## Arquivos Criados/Modificados

### Novos Arquivos:
- `supabase/migrations/012_fix_rls_recursion_profiles.sql` - Migração para corrigir recursão RLS

### Arquivos Modificados:
- `src/lib/db/offers.ts` - Removidas referências a `niches`
- `src/lib/db/dashboard.ts` - Removidas referências a `niches`
- `src/lib/db/admin/offers.ts` - Removidas referências a `niches`












