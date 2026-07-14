-- Migration v4: AI Vibe Judge & Snap Hunt Schemas

-- =====================================================================
-- 1. AI VIBE JUDGE TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.vibe_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' NOT NULL, -- pending, both_submitted, judged
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dispute_arguments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid REFERENCES public.vibe_disputes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  argument_text text NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (dispute_id, user_id) -- one argument per user per dispute
);

CREATE TABLE IF NOT EXISTS public.dispute_verdicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid REFERENCES public.vibe_disputes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  winner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE, -- can be null if draw or custom
  verdict_text text NOT NULL,
  playful_sentence text, -- e.g. "loser buys ice cream"
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================================
-- 2. SNAP HUNT TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.snap_hunts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  clue text NOT NULL,
  status text DEFAULT 'active' NOT NULL, -- active, judged
  started_at timestamptz DEFAULT now() NOT NULL,
  duration_seconds int DEFAULT 90 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.snap_hunt_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id uuid REFERENCES public.snap_hunts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL, -- storage path key
  submitted_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (hunt_id, user_id) -- one entry per user per hunt
);

CREATE TABLE IF NOT EXISTS public.snap_hunt_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id uuid REFERENCES public.snap_hunts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  winner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reasoning text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE public.vibe_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snap_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snap_hunt_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snap_hunt_results ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 4. RLS POLICIES FOR AI VIBE JUDGE
-- =====================================================================

-- vibe_disputes
CREATE POLICY "Users can view disputes for their pair"
  ON public.vibe_disputes FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = vibe_disputes.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert disputes for their active pair"
  ON public.vibe_disputes FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
        AND pairs.status = 'active'
    )
  );

CREATE POLICY "Users can update disputes for their active pair"
  ON public.vibe_disputes FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = vibe_disputes.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

-- dispute_arguments
CREATE POLICY "Users can view arguments for their pair"
  ON public.dispute_arguments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vibe_disputes d
      JOIN public.pairs p ON p.id = d.pair_id
      WHERE d.id = dispute_arguments.dispute_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert arguments for their pair"
  ON public.dispute_arguments FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.vibe_disputes d
      JOIN public.pairs p ON p.id = d.pair_id
      WHERE d.id = dispute_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
        AND p.status = 'active'
    )
  );

-- dispute_verdicts
CREATE POLICY "Users can view verdicts for their pair"
  ON public.dispute_verdicts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vibe_disputes d
      JOIN public.pairs p ON p.id = d.pair_id
      WHERE d.id = dispute_verdicts.dispute_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Admin/System can write verdicts"
  ON public.dispute_verdicts FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- 5. RLS POLICIES FOR SNAP HUNT
-- =====================================================================

-- snap_hunts
CREATE POLICY "Users can view hunts for their pair"
  ON public.snap_hunts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = snap_hunts.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert hunts for their active pair"
  ON public.snap_hunts FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
        AND pairs.status = 'active'
    )
  );

CREATE POLICY "Users can update hunts for their active pair"
  ON public.snap_hunts FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = snap_hunts.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

-- snap_hunt_entries
CREATE POLICY "Users can view entries for their pair"
  ON public.snap_hunt_entries FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.snap_hunts h
      JOIN public.pairs p ON p.id = h.pair_id
      WHERE h.id = snap_hunt_entries.hunt_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert entries for their pair"
  ON public.snap_hunt_entries FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.snap_hunts h
      JOIN public.pairs p ON p.id = h.pair_id
      WHERE h.id = hunt_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
        AND p.status = 'active'
    )
  );

-- snap_hunt_results
CREATE POLICY "Users can view results for their pair"
  ON public.snap_hunt_results FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.snap_hunts h
      JOIN public.pairs p ON p.id = h.pair_id
      WHERE h.id = snap_hunt_results.hunt_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Admin/System can write hunt results"
  ON public.snap_hunt_results FOR ALL USING (true) WITH CHECK (true);
