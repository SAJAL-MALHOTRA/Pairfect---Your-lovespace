-- Migration v39: Subscriptions Schema & Constraints on pairs table
-- Adds explicit subscription tracking to pairs with CHECK constraints and unique partial index.

ALTER TABLE public.pairs
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'plus', 'forever')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (subscription_status IN ('inactive', 'active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_order_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Partial unique index ensures an order is never assigned to multiple pairs
CREATE UNIQUE INDEX IF NOT EXISTS pairs_subscription_order_id_unique
ON public.pairs(subscription_order_id)
WHERE subscription_order_id IS NOT NULL;

-- Performance index for active subscription lookups & expiration sweeps
CREATE INDEX IF NOT EXISTS idx_pairs_subscription_status
ON public.pairs(subscription_status, subscription_expires_at);

-- Add metadata column to payments table if not already present
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
