# Como Remover Todas as Listas

## Opção 1: Remover Apenas Suas Listas (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script**
   - Abra o arquivo: `REMOVER_LISTAS_MEU_USUARIO.sql`
   - Copie o conteúdo
   - Cole no SQL Editor
   - Execute passo a passo:
     - Primeiro execute: `SELECT auth.uid() AS meu_user_id;` para ver seu ID
     - Depois execute: `SELECT COUNT(*) FROM tarefa_listas WHERE user_id = auth.uid();` para ver quantas listas você tem
     - Por fim, descomente e execute: `DELETE FROM tarefa_listas WHERE user_id = auth.uid();`

## Opção 2: Remover Todas as Listas de Todos os Usuários

⚠️ **ATENÇÃO**: Isso vai deletar TODAS as listas de TODOS os usuários!

1. **Acesse o Supabase Dashboard**
2. **Abra o SQL Editor**
3. **Execute o Script**
   - Abra o arquivo: `REMOVER_TODAS_LISTAS.sql`
   - Copie o conteúdo
   - Cole no SQL Editor
   - Execute passo a passo:
     - Primeiro veja quantas listas existem: `SELECT COUNT(*) FROM tarefa_listas;`
     - Depois descomente e execute: `DELETE FROM tarefa_listas;`

## Verificar Após Deletar

Após executar a deleção, execute:

```sql
SELECT COUNT(*) FROM tarefa_listas;
```

Deve retornar `0` (ou o número de listas restantes se você deletou apenas as suas).

## Limpar Tarefas Também (Opcional)

Se você também quiser deletar as tarefas que estavam nas listas:

```sql
-- Deletar tarefas do seu usuário
DELETE FROM tarefas WHERE user_id = auth.uid();

-- OU deletar todas as tarefas de todos os usuários
DELETE FROM tarefas;
```

## Após Limpar

1. Recarregue a página de tarefas no navegador
2. Você verá a mensagem "Nenhuma lista criada ainda"
3. Clique em "Criar Primeira Lista" para começar do zero







