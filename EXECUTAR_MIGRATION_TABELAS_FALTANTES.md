# Executar Migration - Tabelas Faltantes

## Problema Resolvido

Esta migration resolve os erros 500 e 401 nas seguintes rotas de API:
- `/api/espionagem/organizador-biblioteca` - Tabelas `biblioteca_pastas` e `biblioteca_itens`
- `/api/produtividade/tarefas/listas` - Tabela `tarefa_listas`
- `/api/produtividade/metas` - Tabela `metas`
- `/api/produtividade/financeiro` - Tabela `transacoes_financeiras`
- `/api/produtividade/anotacoes` - Tabela `anotacoes` (com coluna `cor`)

## Como Executar

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute a Migration**
   - Abra o arquivo: `supabase/migrations/051_fix_missing_tables.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verificar Execução**
   - A migration deve executar sem erros
   - Você verá mensagens de sucesso para cada tabela criada

## O que a Migration Faz

A migration `051_fix_missing_tables.sql` cria:

1. **Função Helper**: `update_updated_at_column()` - Para atualizar automaticamente o campo `updated_at`

2. **Tabelas de Biblioteca**:
   - `biblioteca_pastas` - Pastas para organizar itens
   - `biblioteca_itens` - Itens salvos nas pastas

3. **Tabela de Tarefas**:
   - `tarefa_listas` - Listas de tarefas (Kanban/Trello)

4. **Tabelas de Produtividade**:
   - `metas` - Metas financeiras e objetivos
   - `anotacoes` - Anotações com suporte a cores
   - `transacoes_financeiras` - Receitas e despesas

5. **Configurações de Segurança**:
   - Políticas RLS (Row Level Security) para todas as tabelas
   - Índices para performance
   - Triggers para atualização automática de `updated_at`

## Após Executar

1. **Teste as Rotas de API**:
   - As rotas devem parar de retornar erros 500
   - A autenticação deve funcionar corretamente (sem erros 401)

2. **Verifique no Supabase**:
   - Vá em "Table Editor"
   - Confirme que as tabelas foram criadas:
     - `biblioteca_pastas`
     - `biblioteca_itens`
     - `tarefa_listas`
     - `metas`
     - `anotacoes`
     - `transacoes_financeiras`

## Notas Importantes

- A migration usa `CREATE TABLE IF NOT EXISTS`, então é segura executar múltiplas vezes
- As políticas RLS são criadas apenas se não existirem (usando `DO $$`)
- A coluna `cor` em `anotacoes` será adicionada se a tabela já existir sem ela
- Todos os triggers são recriados (DROP IF EXISTS + CREATE) para garantir que estão funcionando

## Troubleshooting

Se encontrar erros:

1. **Erro de permissão**: Certifique-se de estar usando a conta admin do Supabase
2. **Erro de função**: A função `update_updated_at_column` será criada automaticamente
3. **Erro de política duplicada**: As políticas são criadas apenas se não existirem

Se os erros persistirem, verifique os logs do SQL Editor para mais detalhes.

