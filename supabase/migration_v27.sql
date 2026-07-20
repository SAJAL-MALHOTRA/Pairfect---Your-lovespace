-- Migration v27: Hardened Unlink Pair RPC & Data Preservation Guarantee

-- 1. Add DELETE policy on public.pairs if not present (only for own pending solo pairs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pairs' AND policyname = 'Users can delete pairs they belong to'
  ) THEN
    CREATE POLICY "Users can delete pairs they belong to"
      ON public.pairs FOR DELETE
      USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
  END IF;
END $$;

-- 2. Hardened SECURITY DEFINER RPC function to safely & completely unlink user
-- Prevents search_path hijacking, strictly checks auth.uid(), and preserves active pair history.
CREATE OR REPLACE FUNCTION public.unlink_user_pair()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pair RECORD;
  v_unlinked_count INTEGER := 0;
BEGIN
  -- Strict authorization check
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Loop through all active or pending pairs the user belongs to
  FOR v_pair IN 
    SELECT id, user_a_id, user_b_id, status 
    FROM public.pairs 
    WHERE (user_a_id = v_user_id OR user_b_id = v_user_id)
      AND status IN ('pending', 'active')
  LOOP
    -- Solo pending invite code (no partner ever joined): safe to delete
    IF v_pair.user_a_id = v_user_id AND v_pair.user_b_id IS NULL THEN
      DELETE FROM public.pairs WHERE id = v_pair.id;
    -- Active pair with partner: PRESERVE pair row & data by updating status to 'unlinked'
    ELSIF v_pair.user_a_id = v_user_id THEN
      UPDATE public.pairs
      SET user_a_id = v_pair.user_b_id,
          user_b_id = NULL,
          status = 'unlinked'
      WHERE id = v_pair.id;
    ELSE
      UPDATE public.pairs
      SET user_b_id = NULL,
          status = 'unlinked'
      WHERE id = v_pair.id;
    END IF;

    v_unlinked_count := v_unlinked_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'unlinked_count', v_unlinked_count);
END;
$$;

-- Security Hardening: Restrict execution permissions
REVOKE EXECUTE ON FUNCTION public.unlink_user_pair() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlink_user_pair() TO authenticated;
