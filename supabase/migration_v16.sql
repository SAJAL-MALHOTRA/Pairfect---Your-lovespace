-- Migration V16: Create quiz_history table to persist finished quiz sessions
CREATE TABLE IF NOT EXISTS public.quiz_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID REFERENCES public.pairs(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  score_correct INT NOT NULL DEFAULT 0,
  score_total INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow pair members to insert quiz history" ON public.quiz_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE id = pair_id
        AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
    )
  );

CREATE POLICY "Allow pair members to select quiz history" ON public.quiz_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE id = pair_id
        AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
    )
  );

CREATE POLICY "Allow pair members to delete quiz history" ON public.quiz_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE id = pair_id
        AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
    )
  );
