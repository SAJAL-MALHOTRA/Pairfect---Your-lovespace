-- Migration v40: 7-Day Couple Trial & Anti-Abuse Tracking
-- Enables 7-day no-card free trial per couple, guarded against room re-creation abuse.

-- 1. Add trial tracking columns to pairs table
ALTER TABLE public.pairs
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. Audit table for historical trial redemptions (anti-farming protection)
-- Even if a couple unlinks or creates a new room, their user IDs are permanently recorded here.
CREATE TABLE IF NOT EXISTS public.pair_trial_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE SET NULL,
  user_a_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_b_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for lightning-fast eligibility check
CREATE INDEX IF NOT EXISTS idx_pair_trial_history_users
ON public.pair_trial_history (user_a_id, user_b_id);

CREATE INDEX IF NOT EXISTS idx_pairs_trial_status
ON public.pairs (trial_used, trial_ends_at, subscription_status);

-- 3. RLS Policies for pair_trial_history
ALTER TABLE public.pair_trial_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trial history" ON public.pair_trial_history;
CREATE POLICY "Users can view their own trial history"
ON public.pair_trial_history FOR SELECT
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- 4. Server function: expire_lapsed_trials()
-- Automatically reverts active trials to free once trial_ends_at passes, unless upgraded with a paid order.
CREATE OR REPLACE FUNCTION public.expire_lapsed_trials()
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  -- Revert pairs whose 7-day trial has passed and who haven't purchased a paid pass
  UPDATE public.pairs
  SET 
    subscription_tier = 'free',
    subscription_status = 'expired',
    subscription_updated_at = timezone('utc'::text, now())
  WHERE 
    subscription_status = 'active'
    AND subscription_tier = 'plus'
    AND trial_used = true
    AND subscription_order_id IS NULL
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at <= timezone('utc'::text, now());

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update trial history table
  UPDATE public.pair_trial_history
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= timezone('utc'::text, now());

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
