# Corrigir Políticas RLS da Tabela tarefa_listas

## Problema

Erro ao criar lista de tarefas:
```
"code": "42501",
"message": "new row violates row-level security policy for table \"tarefa_listas\""
```

Isso significa que as políticas RLS (Row Level Security) estão bloqueando a inserção de dados.

## Solução

Execute a migration de correção:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute a Migration**
   - Abra o arquivo: `supabase/migrations/052_fix_tarefa_listas_rls.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## O que a Migration Faz

1. **Remove todas as políticas RLS existentes** da tabela `tarefa_listas`
2. **Garante que RLS está ativado** na tabela
3. **Recria as políticas RLS corretamente**:
   - SELECT: Usuários podem ver suas próprias listas
   - INSERT: Usuários podem criar suas próprias listas
   - UPDATE: Usuários podem atualizar suas próprias listas
   - DELETE: Usuários podem deletar suas próprias listas

## Verificar se Funcionou

Após executar a migration, execute esta query no SQL Editor:

```sql
SELECT * FROM pg_policies WHERE tablename = 'tarefa_listas';
```

Você deve ver 4 políticas:
- Users can view their own tarefa_listas
- Users can insert their own tarefa_listas
- Users can update their own tarefa_listas
- Users can delete their own tarefa_listas

## Testar

Após executar a migration, tente criar uma lista de tarefas novamente. O erro 500 deve desaparecer.

## Se o Erro Persistir

Se ainda houver erro, verifique:

1. **Se o usuário está autenticado corretamente**
   - Verifique se `auth.uid()` está retornando o ID do usuário
   - Execute: `SELECT auth.uid();` no SQL Editor (deve retornar o UUID do usuário)

2. **Se a tabela existe**
   - Execute: `SELECT * FROM tarefa_listas LIMIT 1;`
   - Se der erro de tabela não encontrada, execute primeiro a migration `051_fix_missing_tables.sql`

3. **Verificar logs do servidor**
   - O console do Next.js mostrará logs detalhados do erro

