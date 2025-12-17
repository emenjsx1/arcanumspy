# Resolver Problema de Ativação de Conta

## Problema
O sistema não está conseguindo identificar as tabelas `payments` e `subscriptions` no Supabase, causando falha na ativação da conta após pagamento.

## Solução

### 1. Executar Migration no Supabase

1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Vá em **SQL Editor**
3. Execute o arquivo: `supabase/migrations/059_ensure_payments_subscriptions_exist.sql`

Esta migration irá:
- Criar as tabelas `payments` e `subscriptions` se não existirem
- Adicionar todas as colunas necessárias
- Criar índices para performance
- Configurar RLS (Row Level Security)

### 2. Ativar Conta Manualmente (Para o usuário keykd47+conta4@gmail.com)

Execute o arquivo `ATIVAR_CONTA_MANUAL.sql` no SQL Editor do Supabase.

Ou execute este SQL diretamente:

```sql
-- Ativar conta do usuário
UPDATE public.profiles
SET 
  has_active_subscription = true,
  subscription_ends_at = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE email = 'keykd47+conta4@gmail.com';

-- Verificar se foi atualizado
SELECT 
  id,
  email,
  name,
  has_active_subscription,
  subscription_ends_at,
  updated_at
FROM public.profiles
WHERE email = 'keykd47+conta4@gmail.com';
```

### 3. Verificar se Tabelas Existem

Execute este SQL para verificar:

```sql
-- Verificar tabela payments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'payments'
ORDER BY ordinal_position;

-- Verificar tabela subscriptions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Verificar colunas do profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('has_active_subscription', 'subscription_ends_at')
ORDER BY ordinal_position;
```

### 4. Após Executar a Migration

O sistema agora:
- ✅ Verifica se as tabelas existem antes de inserir
- ✅ Ativa a conta mesmo se subscription/payment falhar
- ✅ Envia email de confirmação com data de término
- ✅ Verifica se conta foi realmente ativada antes de retornar sucesso

## Próximos Passos

1. Execute a migration `059_ensure_payments_subscriptions_exist.sql`
2. Execute o script de ativação manual para o usuário
3. Teste um novo pagamento para verificar se funciona







