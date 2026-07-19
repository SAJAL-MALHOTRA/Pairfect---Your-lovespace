-- Migration v25: Photo Booth feature
-- Run in Supabase SQL Editor.

-- 1. photo_strips table
CREATE TABLE IF NOT EXISTS public.photo_strips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  layout text NOT NULL DEFAULT 'strip_4',
  title text,
  caption text,
  frame_color text DEFAULT 'cream',
  paper_texture text DEFAULT 'plain',
  filter text DEFAULT 'none',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. photo_strip_images table
CREATE TABLE IF NOT EXISTS public.photo_strip_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strip_id uuid REFERENCES public.photo_strips(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0
);

-- 3. photo_strip_stickers table
CREATE TABLE IF NOT EXISTS public.photo_strip_stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strip_id uuid REFERENCES public.photo_strips(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  x double precision DEFAULT 0,
  y double precision DEFAULT 0,
  rotation double precision DEFAULT 0,
  scale double precision DEFAULT 1
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.photo_strips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_strip_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_strip_stickers ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Pair members can manage photo_strips" ON public.photo_strips;
CREATE POLICY "Pair members can manage photo_strips"
  ON public.photo_strips FOR ALL
  USING (
    pair_id IN (
      SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Pair members can manage photo_strip_images" ON public.photo_strip_images;
CREATE POLICY "Pair members can manage photo_strip_images"
  ON public.photo_strip_images FOR ALL
  USING (
    strip_id IN (
      SELECT id FROM photo_strips WHERE pair_id IN (
        SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Pair members can manage photo_strip_stickers" ON public.photo_strip_stickers;
CREATE POLICY "Pair members can manage photo_strip_stickers"
  ON public.photo_strip_stickers FOR ALL
  USING (
    strip_id IN (
      SELECT id FROM photo_strips WHERE pair_id IN (
        SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      )
    )
  );

NOTIFY pgrst, 'reload schema';
