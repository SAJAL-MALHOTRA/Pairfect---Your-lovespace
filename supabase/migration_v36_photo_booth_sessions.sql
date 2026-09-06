-- Migration v36: Synchronized Virtual Photobooth Sessions & Realtime
-- Single source of truth for synchronized two-person photobooth sessions.

-- 1. photo_booth_sessions table
CREATE TABLE IF NOT EXISTS public.photo_booth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE,
  host_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
  guest_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  booth_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'WAITING'
    CHECK (status IN ('WAITING','PARTNER_JOINED','READY','COUNTDOWN','CAPTURE','PREVIEW','FINISHED','EXPIRED')),
  current_shot int NOT NULL DEFAULT 0,
  total_shots int NOT NULL DEFAULT 4,
  capture_at timestamptz,
  current_prompt text,
  layout_style text DEFAULT 'strip_4',
  perspective text DEFAULT 'SIDE_BY_SIDE'
    CHECK (perspective IN ('TOGETHER','SIDE_BY_SIDE')),
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '30 minutes')
);

-- 2. photo_booth_shots table
CREATE TABLE IF NOT EXISTS public.photo_booth_shots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.photo_booth_sessions(id) ON DELETE CASCADE NOT NULL,
  shot_number int NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  captured_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_booth_code ON public.photo_booth_sessions(booth_code) WHERE status != 'EXPIRED';
CREATE INDEX IF NOT EXISTS idx_booth_shots_session ON public.photo_booth_shots(session_id, shot_number);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.photo_booth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_booth_shots ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Session members can view and update booth sessions" ON public.photo_booth_sessions;
CREATE POLICY "Session members can view and update booth sessions"
  ON public.photo_booth_sessions FOR ALL
  USING (
    host_user_id = auth.uid()
    OR guest_user_id = auth.uid()
    OR (
      pair_id IS NOT NULL AND pair_id IN (
        SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      )
    )
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

DROP POLICY IF EXISTS "Session members can manage booth shots" ON public.photo_booth_shots;
CREATE POLICY "Session members can manage booth shots"
  ON public.photo_booth_shots FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.photo_booth_sessions
      WHERE host_user_id = auth.uid() OR guest_user_id = auth.uid()
         OR (pair_id IS NOT NULL AND pair_id IN (
           SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
         ))
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.photo_booth_sessions
      WHERE host_user_id = auth.uid() OR guest_user_id = auth.uid()
         OR (pair_id IS NOT NULL AND pair_id IN (
           SELECT id FROM public.pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
         ))
    )
  );

-- 6. REPLICA IDENTITY for Realtime Postgres Changes
ALTER TABLE public.photo_booth_sessions REPLICA IDENTITY FULL;

-- 7. Add to Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_booth_sessions;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
