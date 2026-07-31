-- Migration v31: Improved join_pair_by_code RPC with orphaned pending pair cleanup

CREATE OR REPLACE FUNCTION public.join_pair_by_code(code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_joining_user_id uuid := auth.uid();
  target_pair_id uuid;
BEGIN
  IF v_joining_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Clean up any unjoined pending pair created by the joining user
  DELETE FROM public.pairs
  WHERE user_a_id = v_joining_user_id
    AND user_b_id IS NULL
    AND status = 'pending';

  -- 2. Update the target pair row to active status
  UPDATE public.pairs
  SET user_b_id = v_joining_user_id,
      status = 'active',
      started_dating_date = COALESCE(started_dating_date, CURRENT_DATE)
  WHERE invite_code = UPPER(TRIM(code))
    AND status = 'pending'
    AND user_b_id IS NULL
    AND user_a_id != v_joining_user_id
  RETURNING id INTO target_pair_id;

  IF target_pair_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code or pair is no longer joinable.';
  END IF;

  RETURN target_pair_id;
END;
$$;
