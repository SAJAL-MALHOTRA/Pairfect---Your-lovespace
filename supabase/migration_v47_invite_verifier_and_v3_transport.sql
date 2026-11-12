-- Migration v47: Invite Verifier & Transport v3 Hardening
-- 1. Add invite_verifier and invite_issued_at columns to public.pairs
ALTER TABLE public.pairs
  ADD COLUMN IF NOT EXISTS invite_verifier text,
  ADD COLUMN IF NOT EXISTS invite_issued_at timestamptz NOT NULL DEFAULT now();

-- 2. Update prevent_pair_tampering() trigger function
CREATE OR REPLACE FUNCTION public.prevent_pair_tampering()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Always permit operations from service_role, postgres, or supabase_admin
  IF auth.role() = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- If operation originates from an authenticated client
  IF auth.role() = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      -- Force safe defaults for all client-initiated pair inserts
      NEW.subscription_tier := 'free';
      NEW.subscription_status := 'inactive';
      NEW.subscription_expires_at := NULL;
      NEW.subscription_order_id := NULL;

      -- Core identity: client-created pair must be owned by creator in pending state without partner
      NEW.user_a_id := auth.uid();
      NEW.user_b_id := NULL;
      NEW.status := 'pending';

      -- v47: Client can supply invite_verifier for v3 transport; force invite_issued_at := now()
      NEW.invite_issued_at := now();
      -- NEW.invite_verifier is preserved as supplied by client (or null for legacy v1)
      RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
      -- 1. Block tampering with subscription/billing entitlements
      IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
         OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
         OR OLD.subscription_expires_at IS DISTINCT FROM NEW.subscription_expires_at
         OR OLD.subscription_order_id IS DISTINCT FROM NEW.subscription_order_id THEN
        RAISE EXCEPTION 'Clients are not permitted to modify subscription billing columns directly.';
      END IF;

      -- 2. Block tampering with core pair membership and identity
      IF OLD.user_a_id IS DISTINCT FROM NEW.user_a_id
         OR OLD.user_b_id IS DISTINCT FROM NEW.user_b_id
         OR OLD.invite_code IS DISTINCT FROM NEW.invite_code
         OR OLD.status IS DISTINCT FROM NEW.status THEN
        RAISE EXCEPTION 'Clients are not permitted to modify pair membership, invite codes, or status directly. Use official join and unlink endpoints.';
      END IF;

      -- 3. Block tampering with invite verifier and issuance timestamp
      IF OLD.invite_verifier IS DISTINCT FROM NEW.invite_verifier
         OR OLD.invite_issued_at IS DISTINCT FROM NEW.invite_issued_at THEN
        RAISE EXCEPTION 'Clients are not permitted to modify invite verifier or issuance timestamp directly. Use official regeneration endpoints.';
      END IF;

      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pairs_lock_tampering ON public.pairs;
CREATE TRIGGER pairs_lock_tampering
  BEFORE INSERT OR UPDATE ON public.pairs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_pair_tampering();

-- 3. Drop legacy redundant identity trigger that blocks service_role invite code regeneration
DROP TRIGGER IF EXISTS pairs_lock_identity ON public.pairs;
DROP FUNCTION IF EXISTS public.prevent_pair_id_tampering();
