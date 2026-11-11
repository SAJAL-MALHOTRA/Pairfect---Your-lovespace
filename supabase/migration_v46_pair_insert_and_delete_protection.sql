-- Migration v46: Pair INSERT Hardening & Destructive Cascade DELETE Protection
-- 1. Extend prevent_pair_tampering() to BEFORE INSERT OR UPDATE
--    - Closes loose bypass: checks auth.role() = 'service_role' OR current_user IN ('postgres', 'supabase_admin')
--    - For authenticated client INSERTs: forces canonical free defaults (tier = 'free', status = 'pending',
--      sub_status = 'inactive', sub_expires_at = NULL, sub_order_id = NULL, user_b_id = NULL).
--    - Preserves trial engine (which executes server-side via startPairTrial under service_role).
-- 2. Restrict pairs DELETE:
--    - Dynamically drops all existing DELETE policies on public.pairs (including "Users can delete pairs they belong to").
--    - Allows deletion ONLY for unjoined 'pending' pairs by creator user_a_id (canceling an invite).
--    - Active pairs cannot be deleted directly from client; unlinking must go through /api/auth/unlink-pair.

-- =====================================================================
-- 1. HARDEN PAIRS INSERT & UPDATE TRIGGER
-- =====================================================================

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

-- =====================================================================
-- 2. DYNAMICALLY DROP ALL OLD DELETE POLICIES & ENFORCE PENDING-ONLY DELETE
-- =====================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pairs' AND cmd = 'DELETE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pairs', pol.policyname);
  END LOOP;
END $$;

-- Allow users to delete ONLY their own pending unjoined pair (e.g. canceling an invite code).
-- Active pairs cannot be deleted directly from client to prevent cascading wipe of shared memories.
-- Active pair dissolution must execute through the official server-side /api/auth/unlink-pair endpoint.
CREATE POLICY "Users can cancel their own pending pairs"
  ON public.pairs FOR DELETE
  USING (
    auth.uid() = user_a_id AND status = 'pending'
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
