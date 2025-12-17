# 🔧 Plano Completo de Correção - Build Vercel

## 🎯 Problemas Identificados

### 1. ❌ ERRO CRÍTICO: "Property 'email' does not exist on type 'never'"
**Arquivo:** `src/app/api/admin/comunicacao/route.ts:100`
**Causa:** Query Supabase retorna `never[]` porque `profiles` não tem campo `email` no tipo Database
**Solução:** Criar tipo correto ou buscar email de `auth.users` separadamente

### 2. ⚠️ Warnings React Hooks
**Arquivos:** ~30 arquivos com dependências faltando
**Solução:** Adicionar dependências ou usar `useCallback`/`useMemo`

### 3. ⚠️ Edge Runtime com Supabase
**Arquivos:** Verificar rotas API que usam Supabase
**Solução:** Garantir `runtime = "nodejs"` ou remover

---

## 📋 Plano de Ação

### Fase 1: Corrigir Erro Crítico TypeScript
1. Corrigir `src/app/api/admin/comunicacao/route.ts` - Tipar corretamente users
2. Verificar e corrigir outros arquivos com problema similar

### Fase 2: Corrigir Warnings React Hooks
1. Identificar todos os arquivos com warnings
2. Corrigir dependências uma por uma

### Fase 3: Verificar Edge Runtime
1. Buscar todas as rotas API
2. Verificar se usam Supabase
3. Garantir runtime correto

### Fase 4: Otimizações
1. Remover código morto
2. Otimizar imports
3. Melhorar tipagem

---

## 🚀 Implementação

Vou começar corrigindo os erros críticos primeiro.







