-- Migration v42: Watch Together 1:1 Video Calls & Screen Sharing
-- Creates watch_sessions table to manage couple call lifecycles, active states, and RLS policies.

CREATE TABLE IF NOT EXISTS public.watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  initiator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting' | 'active' | 'ended'
  mode TEXT NOT NULL DEFAULT 'camera',    -- 'camera' | 'screenshare'
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup index for active session per couple
CREATE INDEX IF NOT EXISTS idx_watch_sessions_pair_status 
  ON public.watch_sessions(pair_id, status);

-- Enable Row Level Security
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Read: Partners can view sessions belonging to their pair
CREATE POLICY "Partners can view their watch sessions" ON public.watch_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = watch_sessions.pair_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

-- 2. Insert: A partner can start a session for their pair
CREATE POLICY "Partners can start a watch session" ON public.watch_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    initiator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = watch_sessions.pair_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

-- 3. Update: Partners can update status / end their pair's session
CREATE POLICY "Partners can update their watch session" ON public.watch_sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = watch_sessions.pair_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = watch_sessions.pair_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );
