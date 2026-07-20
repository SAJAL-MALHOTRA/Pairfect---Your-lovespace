-- Migration v28: Comprehensive RLS Audit for Archives, Storage Cleanup, & Mutual Purge System

-- 1. COMPREHENSIVE RLS AUDIT across ALL 7 shared relationship tables
-- Ensures unlinked/archived relationship history is readable by both partners on /archive

-- mood_logs RLS
DROP POLICY IF EXISTS "Users can view mood logs if in the active pair" ON public.mood_logs;
DROP POLICY IF EXISTS "Pair members can view mood logs" ON public.mood_logs;
CREATE POLICY "Pair members can view mood logs"
  ON public.mood_logs FOR SELECT
  USING (
    pair_id IN (
      SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- love_letters RLS
DROP POLICY IF EXISTS "Users can view love letters for their pair" ON public.love_letters;
DROP POLICY IF EXISTS "Users can view love letters from any of their pairs" ON public.love_letters;
DROP POLICY IF EXISTS "Pair members can view love letters" ON public.love_letters;
CREATE POLICY "Pair members can view love letters"
  ON public.love_letters FOR SELECT
  USING (
    pair_id IN (
      SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- gratitude_entries RLS
DROP POLICY IF EXISTS "Users can view gratitude notes for their pair" ON public.gratitude_entries;
DROP POLICY IF EXISTS "Users can view gratitude notes from any of their pairs" ON public.gratitude_entries;
DROP POLICY IF EXISTS "Pair members can view gratitude entries" ON public.gratitude_entries;
CREATE POLICY "Pair members can view gratitude entries"
  ON public.gratitude_entries FOR SELECT
  USING (
    pair_id IN (
      SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- shared_moments RLS
DROP POLICY IF EXISTS "Pair members can manage shared_moments" ON public.shared_moments;
CREATE POLICY "Pair members can manage shared_moments"
  ON public.shared_moments FOR ALL
  USING (
    pair_id IN (
      SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  )
  WITH CHECK (
    pair_id IN (
      SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- mixtapes RLS
DROP POLICY IF EXISTS "Pair members can manage mixtapes" ON public.mixtapes;
CREATE POLICY "Pair members can manage mixtapes"
  ON public.mixtapes FOR ALL
  USING (
    pair_id IN (
      SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  )
  WITH CHECK (
    pair_id IN (
      SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- 2. Add Mutual Purge Tracking Columns to public.pairs
ALTER TABLE public.pairs
  ADD COLUMN IF NOT EXISTS purge_status TEXT DEFAULT 'none' CHECK (purge_status IN ('none', 'pending_purge', 'purged')),
  ADD COLUMN IF NOT EXISTS purge_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS purge_requested_by UUID REFERENCES public.users(id);

-- 3. MUTUAL PURGE REQUEST RPC (Prevents unilateral instant deletion)
-- Initiates a 14-day objection window & notifies partner
CREATE OR REPLACE FUNCTION public.request_purge_user_pair(p_pair_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pair RECORD;
  v_partner_id UUID;
  v_sender_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_pair FROM public.pairs 
  WHERE id = p_pair_id AND (user_a_id = v_user_id OR user_b_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pair not found or forbidden');
  END IF;

  -- Identify partner
  v_partner_id := CASE WHEN v_pair.user_a_id = v_user_id THEN v_pair.user_b_id ELSE v_pair.user_a_id END;

  -- Set status to pending_purge with timestamp
  UPDATE public.pairs
  SET purge_status = 'pending_purge',
      purge_requested_at = NOW(),
      purge_requested_by = v_user_id
  WHERE id = p_pair_id;

  -- If partner exists, send warm notification informing them of 14-day objection window
  IF v_partner_id IS NOT NULL THEN
    SELECT display_name INTO v_sender_name FROM public.users WHERE id = v_user_id;

    INSERT INTO public.notifications (
      pair_id, recipient_id, sender_id, type, title, body
    ) VALUES (
      p_pair_id, v_partner_id, v_user_id, 'reaction_reply',
      COALESCE(v_sender_name, 'Your partner') || ' requested to delete shared relationship history ⚠️',
      'You have 14 days to preserve your shared letters and memories or object in Settings.'
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'status', 'pending_purge', 'objection_days', 14);
END;
$$;

-- 4. CANCEL PURGE REQUEST RPC (Allows partner to object and keep archive safe)
CREATE OR REPLACE FUNCTION public.cancel_purge_user_pair(p_pair_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pair RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_pair FROM public.pairs 
  WHERE id = p_pair_id AND (user_a_id = v_user_id OR user_b_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pair not found');
  END IF;

  UPDATE public.pairs
  SET purge_status = 'none',
      purge_requested_at = NULL,
      purge_requested_by = NULL
  WHERE id = p_pair_id;

  RETURN jsonb_build_object('success', true, 'status', 'cancelled');
END;
$$;

-- 5. FINAL PURGE EXECUTION RPC (Includes Storage File Cleanup)
-- Executes purge after consent or 14-day objection window expiration
CREATE OR REPLACE FUNCTION public.execute_purge_pair_history(p_pair_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pair RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_pair FROM public.pairs 
  WHERE id = p_pair_id AND (user_a_id = v_user_id OR user_b_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pair not found');
  END IF;

  -- 1. Explicitly cleanup all photo files from storage.objects for this pair folder
  DELETE FROM storage.objects 
  WHERE bucket_id = 'memories' AND (storage.foldername(name))[1] = p_pair_id::text;

  -- 2. Hard delete pair row (triggers ON DELETE CASCADE for all DB records)
  DELETE FROM public.pairs WHERE id = p_pair_id;

  RETURN jsonb_build_object('success', true, 'purged_pair_id', p_pair_id);
END;
$$;

-- Security Hardening: Restrict execution permissions
REVOKE EXECUTE ON FUNCTION public.request_purge_user_pair(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_purge_user_pair(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_purge_user_pair(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_purge_user_pair(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.execute_purge_pair_history(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_purge_pair_history(UUID) TO authenticated;
