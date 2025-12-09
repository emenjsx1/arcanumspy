-- ============================================
-- ARCANUMSPY - COMPLETE SCHEMA UPDATES
-- Migration 008: Adiciona novas funcionalidades
-- ============================================

-- ============================================
-- 1. CREATE NEW ENUM TYPES
-- ============================================

-- Ticket status enum
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');

-- Ticket priority enum
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'failed', 'refunded');

-- Reply from role enum
CREATE TYPE from_role AS ENUM ('user', 'admin');

-- Funnel type enum (atualiza o existente se necessário)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'funnel_type_enum') THEN
    CREATE TYPE funnel_type_enum AS ENUM ('vsl', 'sl', 'quiz', 'advertorial', 'longform', 'other');
  END IF;
END $$;

-- ============================================
-- 2. UPDATE PROFILES TABLE - ADD phone_number
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- ============================================
-- 3. CREATE NICHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS niches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. CREATE TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reply_at TIMESTAMPTZ,
  last_reply_from from_role
);

-- ============================================
-- 5. CREATE TICKET_REPLIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  from_role from_role NOT NULL
);

-- ============================================
-- 6. CREATE PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  provider TEXT, -- 'stripe', 'e2payments', 'manual', etc.
  external_id TEXT, -- ID da transação no gateway
  paid_at TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. CREATE COMMUNITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  join_link TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. CREATE COMMUNITY_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- ============================================
-- 9. UPDATE OFFERS TABLE
-- ============================================

-- Adicionar novos campos
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS niche_id UUID REFERENCES niches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS facebook_ads_url TEXT,
ADD COLUMN IF NOT EXISTS vsl_url TEXT,
ADD COLUMN IF NOT EXISTS drive_copy_url TEXT,
ADD COLUMN IF NOT EXISTS drive_creatives_url TEXT,
ADD COLUMN IF NOT EXISTS quiz_url TEXT;

-- Remover campo niche TEXT (será migrado para niche_id depois)
-- NOTA: Não removemos imediatamente para não perder dados
-- O campo será removido após migração dos dados

-- ============================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================

-- Niches indexes
CREATE INDEX IF NOT EXISTS idx_niches_category_id ON niches(category_id);
CREATE INDEX IF NOT EXISTS idx_niches_is_active ON niches(is_active);
CREATE INDEX IF NOT EXISTS idx_niches_slug ON niches(slug);

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- Ticket replies indexes
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_user_id ON ticket_replies(user_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_plan_id ON payments(plan_id);

-- Communities indexes
CREATE INDEX IF NOT EXISTS idx_communities_is_active ON communities(is_active);

-- Community members indexes
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);

-- Offers new indexes
CREATE INDEX IF NOT EXISTS idx_offers_niche_id ON offers(niche_id);

-- ============================================
-- 11. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Trigger para tickets
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. UPDATE handle_new_user() FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user',
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

