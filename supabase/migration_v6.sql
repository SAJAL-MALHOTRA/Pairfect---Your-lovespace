-- Migration v6: Shared Canvas Schema

-- =====================================================================
-- 1. CREATE TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE UNIQUE NOT NULL, -- One persistent canvas per pair for MVP
  title text DEFAULT 'Shared Canvas' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.canvas_strokes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid REFERENCES public.canvases(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stroke_data jsonb NOT NULL, -- Array of {x, y} coordinates representing the line
  color text NOT NULL,
  stroke_width int DEFAULT 3 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_strokes ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. RLS POLICIES
-- =====================================================================

-- canvases
CREATE POLICY "Users can view canvas for their pair"
  ON public.canvases FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = canvases.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert canvas for their active pair"
  ON public.canvases FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
        AND pairs.status = 'active'
    )
  );

CREATE POLICY "Users can update canvas for their pair"
  ON public.canvases FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = canvases.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

-- canvas_strokes
CREATE POLICY "Users can view strokes for their pair canvas"
  ON public.canvas_strokes FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.canvases c
      JOIN public.pairs p ON p.id = c.pair_id
      WHERE c.id = canvas_strokes.canvas_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert strokes to their pair canvas"
  ON public.canvas_strokes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.canvases c
      JOIN public.pairs p ON p.id = c.pair_id
      WHERE c.id = canvas_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
        AND p.status = 'active'
    )
  );

CREATE POLICY "Users can delete strokes from their pair canvas"
  ON public.canvas_strokes FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.canvases c
      JOIN public.pairs p ON p.id = c.pair_id
      WHERE c.id = canvas_strokes.canvas_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );
