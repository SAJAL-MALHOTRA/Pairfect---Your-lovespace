-- SQL Migration: Permanent Pair Handshake Cleanup & Hard Constraints
-- Copy and run this script in your Supabase Dashboard SQL Editor.

-- 1. Re-create join_pair_by_code with automatic pending cleanup for both users
CREATE OR REPLACE FUNCTION public.join_pair_by_code(code text)
RETURNS uuid AS $$
DECLARE
  target_pair_id uuid;
  target_user_a_id uuid;
BEGIN
  -- A. Check if the user is already part of an active pair with this code
  SELECT id INTO target_pair_id
  FROM public.pairs
  WHERE invite_code = code 
    AND (user_b_id = auth.uid() OR user_a_id = auth.uid())
    AND status = 'active';

  IF target_pair_id IS NOT NULL THEN
    RETURN target_pair_id;
  END IF;

  -- B. Retrieve the creator of the target pending pair
  SELECT user_a_id INTO target_user_a_id
  FROM public.pairs
  WHERE invite_code = code
    AND status = 'pending';

  IF target_user_a_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code or pair is not joinable';
  END IF;

  -- C. Perform standard update for pending pair
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

  -- D. Cleanup: Delete any OTHER pending pairs for BOTH User A and User B to prevent state corruption
  DELETE FROM public.pairs
  WHERE (
    user_a_id = auth.uid() 
    OR user_b_id = auth.uid() 
    OR user_a_id = target_user_a_id 
    OR user_b_id = target_user_a_id
  )
  AND status = 'pending'
  AND id != target_pair_id;

  RETURN target_pair_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Unique Constraints to prevent duplicate active/pending pairs at database level
-- Prevent a user from being User A in multiple active/pending pairs
CREATE UNIQUE INDEX IF NOT EXISTS one_active_or_pending_pair_per_user_a 
ON public.pairs (user_a_id) WHERE (status IN ('pending', 'active'));

-- Prevent a user from being User B in multiple active/pending pairs
CREATE UNIQUE INDEX IF NOT EXISTS one_active_or_pending_pair_per_user_b 
ON public.pairs (user_b_id) WHERE (status IN ('pending', 'active'));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
