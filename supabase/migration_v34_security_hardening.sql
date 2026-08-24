-- Migration v34: Security Hardening & RLS Lockdown
-- Fixes critical love_stories exposure and unrestricted dispute_verdicts write permissions.

-- =====================================================================
-- 1. LOVE STORIES: SCOPE SELECT ACCESS TO PAIR MEMBERS & PUBLISHED STORIES
-- =====================================================================

-- Drop permissive legacy SELECT policies
DROP POLICY IF EXISTS "Authenticated users can read all love stories" ON public.love_stories;
DROP POLICY IF EXISTS "Users can read community or own pair stories" ON public.love_stories;

-- Create hardened SELECT policy:
-- 1. Public community stories that are published can be read by any authenticated user for Explore.
-- 2. Private couple archives or draft stories can ONLY be read by members of the pair.
CREATE POLICY "Users can read community or own pair stories" ON public.love_stories
  FOR SELECT TO authenticated USING (
    (visibility = 'community' AND story_status = 'published')
    OR EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = love_stories.pair_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

-- =====================================================================
-- 2. DISPUTE VERDICTS: REVOKE UNRESTRICTED PUBLIC MUTATION ACCESS
-- =====================================================================

-- Drop overly permissive global write policy (FOR ALL USING (true))
DROP POLICY IF EXISTS "Admin/System can write verdicts" ON public.dispute_verdicts;

-- Ensure dispute_verdicts only allows SELECT for pair members (verdicts are created server-side via service role)
DROP POLICY IF EXISTS "Users can view verdicts for their pair" ON public.dispute_verdicts;

CREATE POLICY "Users can view verdicts for their pair"
  ON public.dispute_verdicts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vibe_disputes d
      JOIN public.pairs p ON p.id = d.pair_id
      WHERE d.id = dispute_verdicts.dispute_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );
