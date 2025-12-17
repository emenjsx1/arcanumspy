-- ============================================
-- Atualizar tabela payments para suportar M-Pesa/e-Mola
-- ============================================

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
  -- Adicionar coluna 'amount' se não existir (para valores em MT, não centavos)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN amount DECIMAL(10,2);
  END IF;

  -- Adicionar coluna 'method' se não existir (mpesa, emola)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'method'
  ) THEN
    ALTER TABLE payments ADD COLUMN method TEXT;
  END IF;

  -- Adicionar coluna 'transaction_id' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN transaction_id TEXT;
  END IF;

  -- Adicionar coluna 'payment_type' se não existir (subscription, one_time)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'subscription';
  END IF;

  -- Adicionar coluna 'notes' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE payments ADD COLUMN notes TEXT;
  END IF;

  -- Adicionar coluna 'payment_date' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_date TIMESTAMPTZ;
  END IF;
END $$;

-- Atualizar subscriptions para adicionar campos necessários
DO $$ 
BEGIN
  -- Adicionar coluna 'plan_name' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_name TEXT;
  END IF;

  -- Adicionar coluna 'price' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN price DECIMAL(10,2);
  END IF;

  -- Adicionar coluna 'is_trial' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN is_trial BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar coluna 'trial_ends_at' se não existir (usar como data de expiração)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);







