-- Migration v24: Fix shared_moments RLS policies
-- Run in Supabase SQL Editor to resolve RLS policy errors when creating memories.

-- 1. Drop existing policies on shared_moments
DROP POLICY IF EXISTS "Users can view moments for their pair" ON public.shared_moments;
DROP POLICY IF EXISTS "Users can insert moments for their active pair" ON public.shared_moments;
DROP POLICY IF EXISTS "Users can update/delete their own moments" ON public.shared_moments;
DROP POLICY IF EXISTS "Pair members can manage shared_moments" ON public.shared_moments;

-- 2. Ensure RLS is enabled
ALTER TABLE public.shared_moments ENABLE ROW LEVEL SECURITY;

-- 3. Create clean unified policy matching all other feature tables (mixtapes, love_letters, etc.)
CREATE POLICY "Pair members can manage shared_moments"
  ON public.shared_moments FOR ALL
  USING (
    pair_id IN (
      SELECT id FROM pairs
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  )
  WITH CHECK (
    pair_id IN (
      SELECT id FROM pairs
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';
