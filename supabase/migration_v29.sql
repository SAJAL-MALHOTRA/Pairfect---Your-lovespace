-- Migration v29: Single Unlink Action with Complete Permanent Data & Storage Deletion

-- 1. DROP old v27/v28 RPCs and policies
DROP FUNCTION IF EXISTS public.unlink_user_pair();
DROP FUNCTION IF EXISTS public.purge_pair_history(UUID);
DROP FUNCTION IF EXISTS public.request_purge_user_pair(UUID);
DROP FUNCTION IF EXISTS public.cancel_purge_user_pair(UUID);
DROP FUNCTION IF EXISTS public.execute_purge_pair_history(UUID);

-- 2. REVERT RLS SELECT POLICIES BACK TO ACTIVE PAIR ONLY
-- (No unlinked archive state — unlinking means immediate total deletion)

DROP POLICY IF EXISTS "Pair members can view mood logs" ON public.mood_logs;
CREATE POLICY "Pair members can view mood logs"
  ON public.mood_logs FOR SELECT
  USING (
    pair_id IN (
      SELECT id FROM public.pairs 
      WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Pair members can view love letters" ON public.love_letters;
CREATE POLICY "Pair members can view love letters"
  ON public.love_letters FOR SELECT
  USING (
    pair_id IN (
      SELECT id FROM public.pairs 
      WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Pair members can view gratitude entries" ON public.gratitude_entries;
CREATE POLICY "Pair members can view gratitude entries"
  ON public.gratitude_entries FOR SELECT
  USING (
    pair_id IN (
      SELECT id FROM public.pairs 
      WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active'
    )
  );

-- 3. ENSURE CASCADE DELETE CONSTRAINTS ON ALL PAIR-DEPENDENT TABLES
DO $$
BEGIN
  -- shared_moments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_moments') THEN
    ALTER TABLE public.shared_moments DROP CONSTRAINT IF EXISTS shared_moments_pair_id_fkey;
    ALTER TABLE public.shared_moments ADD CONSTRAINT shared_moments_pair_id_fkey 
      FOREIGN KEY (pair_id) REFERENCES public.pairs(id) ON DELETE CASCADE;
  END IF;

  -- mixtapes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mixtapes') THEN
    ALTER TABLE public.mixtapes DROP CONSTRAINT IF EXISTS mixtapes_pair_id_fkey;
    ALTER TABLE public.mixtapes ADD CONSTRAINT mixtapes_pair_id_fkey 
      FOREIGN KEY (pair_id) REFERENCES public.pairs(id) ON DELETE CASCADE;
  END IF;

  -- mood_logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mood_logs') THEN
    ALTER TABLE public.mood_logs DROP CONSTRAINT IF EXISTS mood_logs_pair_id_fkey;
    ALTER TABLE public.mood_logs ADD CONSTRAINT mood_logs_pair_id_fkey 
      FOREIGN KEY (pair_id) REFERENCES public.pairs(id) ON DELETE CASCADE;
  END IF;

  -- notifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_pair_id_fkey;
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_pair_id_fkey 
      FOREIGN KEY (pair_id) REFERENCES public.pairs(id) ON DELETE CASCADE;
  END IF;

  -- photo_strips
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photo_strips') THEN
    ALTER TABLE public.photo_strips DROP CONSTRAINT IF EXISTS photo_strips_pair_id_fkey;
    ALTER TABLE public.photo_strips ADD CONSTRAINT photo_strips_pair_id_fkey 
      FOREIGN KEY (pair_id) REFERENCES public.pairs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. SINGLE UNLINK & TOTAL DELETE RPC FUNCTION
-- Verified SECURITY DEFINER, search_path protected, strictly scoped to auth.uid() pair members
CREATE OR REPLACE FUNCTION public.unlink_and_delete_pair(p_pair_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pair RECORD;
BEGIN
  -- Defense in depth: Verify authenticated user
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Defense in depth: Strict check that caller belongs to the target pair
  SELECT * INTO v_pair FROM public.pairs 
  WHERE id = p_pair_id AND (user_a_id = v_user_id OR user_b_id = v_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pair not found or forbidden');
  END IF;

  -- Step 1: Explicit Storage Bucket Object Deletion
  -- Clean up all files in memories bucket associated with this pair_id folder
  DELETE FROM storage.objects 
  WHERE bucket_id = 'memories' AND (storage.foldername(name))[1] = p_pair_id::text;

  -- Step 2: Delete pair row
  -- Cascades to love_letters, shared_moments, mixtapes, mixtape_songs, gratitude_entries, mood_logs, notifications, etc.
  DELETE FROM public.pairs WHERE id = p_pair_id;

  RETURN jsonb_build_object('success', true, 'deleted_pair_id', p_pair_id);
END;
$$;

-- Security Hardening: Revoke PUBLIC, Grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.unlink_and_delete_pair(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlink_and_delete_pair(UUID) TO authenticated;
