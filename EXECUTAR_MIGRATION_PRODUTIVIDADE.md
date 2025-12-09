# 🚀 Executar Migration de Produtividade

## Problema
As rotas de produtividade estão retornando erro 401 (Unauthorized) porque as tabelas não existem no banco de dados.

## Solução

### 1. Execute a Migration no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo: `supabase/migrations/040_create_produtividade_tables.sql`

Ou execute diretamente no SQL Editor:

```sql
-- Copie e cole todo o conteúdo do arquivo 040_create_produtividade_tables.sql
```

### 2. Tabelas que serão criadas:

- ✅ `tarefas` - Gerenciamento de tarefas
- ✅ `metas` - Metas financeiras
- ✅ `anotacoes` - Anotações do usuário
- ✅ `pomodoros` - Histórico de pomodoros
- ✅ `pomodoro_settings` - Configurações do pomodoro
- ✅ `transacoes_financeiras` - Transações financeiras

### 3. Verificar se as tabelas foram criadas

No SQL Editor do Supabase, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tarefas', 'metas', 'anotacoes', 'pomodoros', 'pomodoro_settings', 'transacoes_financeiras');
```

### 4. Verificar RLS (Row Level Security)

Todas as tabelas têm RLS habilitado e políticas configuradas para que usuários só vejam seus próprios dados.

### 5. Testar

Após executar a migration:
1. Faça login na aplicação
2. Acesse as páginas de produtividade:
   - `/produtividade/cronometro` (Pomodoro)
   - `/produtividade/tarefa` (Tarefas)
   - `/produtividade/financeiro` (Financeiro)
   - `/produtividade/meta` (Metas)
   - `/produtividade/anotacoes` (Anotações)

## ⚠️ Se ainda houver erro 401

Se após executar a migration ainda houver erro 401:

1. **Verifique se está logado**: Faça logout e login novamente
2. **Limpe os cookies**: Limpe os cookies do navegador
3. **Verifique as variáveis de ambiente**: Certifique-se de que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas corretamente
4. **Verifique o console do navegador**: Veja se há outros erros relacionados à autenticação

## 📝 Nota

A migration usa `CREATE TABLE IF NOT EXISTS`, então pode ser executada múltiplas vezes sem problemas. Ela também cria todas as políticas RLS necessárias para segurança.



