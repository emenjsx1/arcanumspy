# Verificar se a Tabela tarefa_listas Existe

## Problema
O erro 500 ao criar lista de tarefas indica que a tabela `tarefa_listas` pode não existir no Supabase.

## Como Verificar

### Opção 1: Via Supabase Dashboard

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Table Editor** no menu lateral
4. Procure pela tabela `tarefa_listas`
5. Se não existir, você verá apenas outras tabelas

### Opção 2: Via SQL Editor

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Execute esta query:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'tarefa_listas'
);
```

- Se retornar `true`, a tabela existe
- Se retornar `false`, a tabela NÃO existe

### Opção 3: Verificar Todas as Tabelas

Execute esta query no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'tarefa_listas',
  'biblioteca_pastas',
  'biblioteca_itens',
  'metas',
  'anotacoes',
  'transacoes_financeiras'
)
ORDER BY table_name;
```

Isso mostrará quais tabelas existem e quais estão faltando.

## Solução

Se a tabela não existir, execute a migration:

1. Abra o arquivo: `supabase/migrations/051_fix_missing_tables.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter / Cmd+Enter)

## Verificar Políticas RLS

Se a tabela existir mas ainda houver erro, verifique as políticas RLS:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'tarefa_listas';
```

Se não retornar nenhuma política, execute a migration novamente.

## Verificar Logs do Servidor

No terminal onde o Next.js está rodando, você verá logs detalhados como:

```
[POST /api/produtividade/tarefas/listas] Tabela não existe ou erro de acesso: ...
```

Isso ajudará a identificar o problema exato.

