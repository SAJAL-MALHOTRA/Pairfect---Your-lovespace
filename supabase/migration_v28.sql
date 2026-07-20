-- Migration v28: RLS Read Access for Unlinked Archives & Hard Delete Purge RPC

-- 1. Ensure RLS SELECT policies allow users to read unlinked/archived relationship data
CREATE POLICY "Users can view love letters from any of their pairs"
  ON public.love_letters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = love_letters.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can view gratitude notes from any of their pairs"
  ON public.gratitude_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = gratitude_entries.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

-- 2. SECURITY DEFINER RPC to permanently purge a pair and all cascade-deleted shared data
-- Used ONLY when a user explicitly requests a permanent hard delete of intimate relationship data.
CREATE OR REPLACE FUNCTION public.purge_pair_history(p_pair_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pair RECORD;
BEGIN
  -- 1. Authorization Check
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- 2. Verify user belongs to the target pair
  SELECT * INTO v_pair FROM public.pairs 
  WHERE id = p_pair_id AND (user_a_id = v_user_id OR user_b_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pair not found or forbidden');
  END IF;

  -- 3. Permanent hard delete of the pair row (triggers ON DELETE CASCADE across all tables)
  DELETE FROM public.pairs WHERE id = p_pair_id;

  RETURN jsonb_build_object('success', true, 'purged_pair_id', p_pair_id);
END;
$$;

-- Security Hardening: Restrict execution permissions
REVOKE EXECUTE ON FUNCTION public.purge_pair_history(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_pair_history(UUID) TO authenticated;
