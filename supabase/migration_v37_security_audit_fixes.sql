-- Migration v37: Security Audit Hardening & RLS Lockdown
-- Fixes critical vulnerabilities identified during pre-launch security audit:
-- 1. Revoke public mutation permissions on snap_hunt_results
-- 2. Restrict photo_booth_sessions DELETE to host only (prevent arbitrary session deletion)
-- 3. Restrict story_responses SELECT to community stories or couple members
-- 4. Enforce author identity on gratitude_entries
-- 5. Scope notifications to valid pair recipients

-- =====================================================================
-- 1. SNAP HUNT RESULTS: REVOKE PUBLIC WRITE PERMISSIONS
-- =====================================================================
DROP POLICY IF EXISTS "Admin/System can write hunt results" ON public.snap_hunt_results;

-- Results are readable by pair members and created server-side via Service Role
DROP POLICY IF EXISTS "Users can view results for their pair" ON public.snap_hunt_results;
CREATE POLICY "Users can view results for their pair"
  ON public.snap_hunt_results FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.snap_hunts h
      JOIN public.pairs p ON p.id = h.pair_id
      WHERE h.id = snap_hunt_results.hunt_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

-- =====================================================================
-- 2. PHOTO BOOTH SESSIONS: GRANULAR RLS POLICIES
-- =====================================================================
DROP POLICY IF EXISTS "Session members can view and update booth sessions" ON public.photo_booth_sessions;

-- 2.1 SELECT: Host, guest, pair member, or waiting guest looking up code
CREATE POLICY "Members can view booth sessions"
  ON public.photo_booth_sessions FOR SELECT TO authenticated
  USING (
    host_user_id = auth.uid()
    OR guest_user_id = auth.uid()
    OR (
      pair_id IS NOT NULL AND pair_id IN (
        SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      )
    )
    OR (guest_user_id IS NULL AND status = 'WAITING')
  );

-- 2.2 INSERT: Authenticated host only
CREATE POLICY "Hosts can create booth sessions"
  ON public.photo_booth_sessions FOR INSERT TO authenticated
  WITH CHECK (host_user_id = auth.uid());

-- 2.3 UPDATE: Host, guest, or unassigned guest claiming the slot
CREATE POLICY "Members can update booth sessions"
  ON public.photo_booth_sessions FOR UPDATE TO authenticated
  USING (
    host_user_id = auth.uid()
    OR guest_user_id = auth.uid()
    OR (guest_user_id IS NULL AND status = 'WAITING')
  )
  WITH CHECK (
    host_user_id = auth.uid()
    OR guest_user_id = auth.uid()
    OR (
      pair_id IS NOT NULL AND pair_id IN (
        SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      )
    )
  );

-- 2.4 DELETE: Host only (blocks arbitrary session deletion by other users)
CREATE POLICY "Hosts can delete booth sessions"
  ON public.photo_booth_sessions FOR DELETE TO authenticated
  USING (host_user_id = auth.uid());

-- =====================================================================
-- 3. STORY RESPONSES: RESTRICT READ ACCESS TO PUBLIC OR OWN STORIES
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can read story responses" ON public.story_responses;

CREATE POLICY "Users can read responses for public or own stories"
  ON public.story_responses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.love_stories s
      WHERE s.id = story_responses.story_id
        AND (
          (s.visibility = 'community' AND s.story_status = 'published')
          OR EXISTS (
            SELECT 1 FROM public.pairs p
            WHERE p.id = s.pair_id
              AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
          )
        )
    )
  );

-- =====================================================================
-- 4. GRATITUDE ENTRIES: ENFORCE AUTHOR IDENTITY
-- =====================================================================
DROP POLICY IF EXISTS "Partners can create gratitude entries" ON public.gratitude_entries;

CREATE POLICY "Partners can create gratitude entries"
  ON public.gratitude_entries FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND pair_id IN (
      SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

-- =====================================================================
-- 5. NOTIFICATIONS: ENFORCE PARTNER RECIPIENT
-- =====================================================================
DROP POLICY IF EXISTS "Users can insert notifications as sender" ON public.notifications;

CREATE POLICY "Users can insert notifications as sender"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = notifications.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
        AND (pairs.user_a_id = notifications.recipient_id OR pairs.user_b_id = notifications.recipient_id)
        AND pairs.status = 'active'
    )
  );

NOTIFY pgrst, 'reload schema';
