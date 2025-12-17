-- ============================================
-- GARANTIR QUE TABELAS PAYMENTS E SUBSCRIPTIONS EXISTAM
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- Criar tabela payments se não existir
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  amount DECIMAL(10,2), -- Valor direto em MT
  currency TEXT NOT NULL DEFAULT 'MZN',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'confirmed', 'paid'
  payment_method TEXT, -- 'credit_card', 'pix', 'mpesa', 'emola', etc.
  method TEXT, -- Alias para payment_method
  provider TEXT, -- 'stripe', 'e2payments', 'mpesa', 'emola', etc.
  external_id TEXT, -- ID da transação no gateway
  transaction_id TEXT, -- ID da transação
  invoice_number TEXT UNIQUE,
  invoice_url TEXT,
  notes TEXT,
  metadata JSONB,
  paid_at TIMESTAMPTZ,
  payment_date TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar tabela subscriptions se não existir (usando estrutura básica)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'canceled'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_ends_at TIMESTAMPTZ, -- Campo opcional para data de término
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- Uma subscription ativa por usuário
);

-- Adicionar colunas opcionais se não existirem
DO $$ 
BEGIN
  -- Adicionar colunas à tabela payments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount') THEN
    ALTER TABLE public.payments ADD COLUMN amount DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'method') THEN
    ALTER TABLE public.payments ADD COLUMN method TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'provider') THEN
    ALTER TABLE public.payments ADD COLUMN provider TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'external_id') THEN
    ALTER TABLE public.payments ADD COLUMN external_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'transaction_id') THEN
    ALTER TABLE public.payments ADD COLUMN transaction_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'notes') THEN
    ALTER TABLE public.payments ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_date') THEN
    ALTER TABLE public.payments ADD COLUMN payment_date TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'period_start') THEN
    ALTER TABLE public.payments ADD COLUMN period_start TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'period_end') THEN
    ALTER TABLE public.payments ADD COLUMN period_end TIMESTAMPTZ;
  END IF;

  -- Adicionar colunas à tabela subscriptions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE public.subscriptions ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar colunas ao profiles se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'has_active_subscription') THEN
    ALTER TABLE public.profiles ADD COLUMN has_active_subscription BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_ends_at') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_ends_at TIMESTAMPTZ;
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas RLS para subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );







