-- Migration v45: Security and RLS Patches
-- 1. Fix privilege escalation on notifications INSERT
-- 2. Add missing DELETE policies for love_letters, bouquets, journal_entries, and canvases
-- 3. Restrict beta_waitlist SELECT to service role only (protect user email list)
-- 4. Lock pairs membership and subscription columns against direct client-side tampering

-- =====================================================================
-- 1. NOTIFICATIONS INSERT PRIVILEGE ESCALATION FIX
-- =====================================================================

DROP POLICY IF EXISTS "Users can insert notifications as sender" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications for their partner" ON public.notifications;

CREATE POLICY "Users can insert notifications for their partner"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = notifications.pair_id
        AND pairs.status = 'active'
        AND (
          (pairs.user_a_id = auth.uid() AND pairs.user_b_id = notifications.recipient_id)
          OR
          (pairs.user_b_id = auth.uid() AND pairs.user_a_id = notifications.recipient_id)
        )
    )
  );

-- =====================================================================
-- 2. ADD MISSING DELETE POLICIES
-- =====================================================================

-- Love Letters: allow pair members to delete letters in their pair
DROP POLICY IF EXISTS "Pair members can delete love letters" ON public.love_letters;
CREATE POLICY "Pair members can delete love letters"
  ON public.love_letters FOR DELETE
  USING (
    pair_id IN (
      SELECT id FROM public.pairs
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- Bouquets: allow pair members to delete bouquets in their pair
DROP POLICY IF EXISTS "Pair members can delete bouquets" ON public.bouquets;
CREATE POLICY "Pair members can delete bouquets"
  ON public.bouquets FOR DELETE
  USING (
    pair_id IN (
      SELECT id FROM public.pairs
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- Daily Journal Entries: allow authors to delete their own entries
DROP POLICY IF EXISTS "Authors can delete journal entries" ON public.journal_entries;
CREATE POLICY "Authors can delete journal entries"
  ON public.journal_entries FOR DELETE
  USING (user_id = auth.uid());

-- Canvases: allow pair members to delete canvases in their pair
DROP POLICY IF EXISTS "Pair members can delete canvases" ON public.canvases;
CREATE POLICY "Pair members can delete canvases"
  ON public.canvases FOR DELETE
  USING (
    pair_id IN (
      SELECT id FROM public.pairs
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- Canvas Strokes: allow pair members to delete strokes belonging to their canvases
DROP POLICY IF EXISTS "Pair members can delete canvas strokes" ON public.canvas_strokes;
CREATE POLICY "Pair members can delete canvas strokes"
  ON public.canvas_strokes FOR DELETE
  USING (
    canvas_id IN (
      SELECT id FROM public.canvases
      WHERE pair_id IN (
        SELECT id FROM public.pairs
        WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      )
    )
  );

-- =====================================================================
-- 3. BETA WAITLIST EMAIL PRIVACY RESTRICTION
-- =====================================================================

-- Remove open SELECT policy so regular authenticated users cannot scrape waitlist emails
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.beta_waitlist;

-- =====================================================================
-- 4. PAIR IDENTITY & SUBSCRIPTION COLUMN TAMPERING PROTECTION (INSERT & UPDATE)
-- =====================================================================

-- Prevent client-side modification of subscription plan/tier and core pair membership columns.
-- Server-side endpoints (/api/auth/join-pair, /api/auth/unlink-pair, /api/cashfree/webhook)
-- execute via createAdminClient() with service_role privileges and are strictly permitted.
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

DROP TRIGGER IF EXISTS pairs_lock_subscription ON public.pairs;
DROP TRIGGER IF EXISTS pairs_lock_tampering ON public.pairs;
CREATE TRIGGER pairs_lock_tampering
  BEFORE INSERT OR UPDATE ON public.pairs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_pair_tampering();

-- =====================================================================
-- 5. PROTECT ACTIVE PAIRS FROM UNILATERAL CASCADE DELETION
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
-- Active pairs cannot be deleted directly from client; unlinking must go through /api/auth/unlink-pair
CREATE POLICY "Users can cancel their own pending pairs"
  ON public.pairs FOR DELETE
  USING (
    auth.uid() = user_a_id AND status = 'pending'
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
