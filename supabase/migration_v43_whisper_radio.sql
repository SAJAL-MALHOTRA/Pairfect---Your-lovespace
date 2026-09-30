-- Migration v43: Whisper Radio (Voice Notes on Retro Frequencies)

CREATE TABLE IF NOT EXISTS public.whispers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  sender_name text NOT NULL DEFAULT 'Partner',
  frequency numeric(4,1) NOT NULL DEFAULT 91.7,
  title text NOT NULL DEFAULT 'Whisper Note',
  audio_url text NOT NULL,
  duration numeric(5,1) NOT NULL DEFAULT 0,
  mood_tag text DEFAULT 'romantic',
  listened_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for speedy queries by pair and frequency
CREATE INDEX IF NOT EXISTS idx_whispers_pair_id ON public.whispers(pair_id);
CREATE INDEX IF NOT EXISTS idx_whispers_frequency ON public.whispers(pair_id, frequency);
CREATE INDEX IF NOT EXISTS idx_whispers_created_at ON public.whispers(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.whispers ENABLE ROW LEVEL SECURITY;

-- Pair members can view all whispers in their pair
CREATE POLICY "Pair members can view whispers"
  ON public.whispers FOR SELECT
  USING (
    pair_id IN (
      SELECT id FROM public.pairs
      WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid())
      AND status = 'active'
    )
  );

-- Pair members can insert their own whispers
CREATE POLICY "Pair members can insert whispers"
  ON public.whispers FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND pair_id IN (
      SELECT id FROM public.pairs
      WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid())
      AND status = 'active'
    )
  );

-- Senders can delete their own whispers
CREATE POLICY "Senders can delete whispers"
  ON public.whispers FOR DELETE
  USING (sender_id = auth.uid());

-- Pair members can update listened_at
CREATE POLICY "Pair members can update listened_at"
  ON public.whispers FOR UPDATE
  USING (
    pair_id IN (
      SELECT id FROM public.pairs
      WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid())
      AND status = 'active'
    )
  );
