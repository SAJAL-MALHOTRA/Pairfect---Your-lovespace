-- Migration v23: Mixtape Studio
-- Run in Supabase SQL Editor.

-- 1. Mixtapes table
CREATE TABLE IF NOT EXISTS public.mixtapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL CHECK (char_length(title) <= 100),
  cover_theme text DEFAULT 'music' NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Mixtape Songs table
CREATE TABLE IF NOT EXISTS public.mixtape_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mixtape_id uuid REFERENCES public.mixtapes(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL CHECK (char_length(title) <= 200),
  artist text CHECK (char_length(artist) <= 200),
  spotify_url text,
  youtube_url text,
  apple_music_url text,
  voice_note_url text,
  memory_id uuid,
  photo_emoji text,
  date_memory date,
  location_text text CHECK (char_length(location_text) <= 200),
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  story text CHECK (char_length(story) <= 1000),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Row Level Security
ALTER TABLE public.mixtapes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pair members can manage mixtapes"
  ON public.mixtapes FOR ALL
  USING (
    pair_id IN (
      SELECT id FROM pairs
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

ALTER TABLE public.mixtape_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pair members can manage mixtape_songs"
  ON public.mixtape_songs FOR ALL
  USING (
    mixtape_id IN (
      SELECT id FROM mixtapes
      WHERE pair_id IN (
        SELECT id FROM pairs
        WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      )
    )
  );

-- 4. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mixtapes_pair ON public.mixtapes(pair_id);
CREATE INDEX IF NOT EXISTS idx_mixtape_songs_mixtape ON public.mixtape_songs(mixtape_id);
CREATE INDEX IF NOT EXISTS idx_mixtape_songs_position ON public.mixtape_songs(mixtape_id, position);

NOTIFY pgrst, 'reload schema';
