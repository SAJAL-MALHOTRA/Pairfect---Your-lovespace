-- SQL Migration: Make join_pair_by_code Idempotent
-- Copy and run this script in your Supabase Dashboard SQL Editor.

CREATE OR REPLACE FUNCTION public.join_pair_by_code(code text)
RETURNS uuid AS $$
DECLARE
  target_pair_id uuid;
BEGIN
  -- 1. Check if the user is already part of an active pair with this code
  SELECT id INTO target_pair_id
  FROM public.pairs
  WHERE invite_code = code 
    AND (user_b_id = auth.uid() OR user_a_id = auth.uid())
    AND status = 'active';

  IF target_pair_id IS NOT NULL THEN
    RETURN target_pair_id;
  END IF;

  -- 2. Otherwise, perform standard update for pending pair
  UPDATE public.pairs
  SET user_b_id = auth.uid(), status = 'active'
  WHERE invite_code = code 
    AND status = 'pending' 
    AND user_b_id IS NULL 
    AND user_a_id != auth.uid()
  RETURNING id INTO target_pair_id;

  IF target_pair_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code or pair is not joinable';
  END IF;

  RETURN target_pair_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
