-- Migration v41: Stories & Explore Complete Architecture
-- Connects Our Stories (private couple journal) with Explore (anonymous community knowledge)
-- Implements story_chapters, explore_stories, story_saves, story_helpful, and story_reports

-- 1. Create story_chapters table (private couple journal)
CREATE TABLE IF NOT EXISTS public.story_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_voice text NOT NULL DEFAULT 'me' CHECK (author_voice IN ('me', 'partner', 'joint')),
  author_display text,
  title text NOT NULL,
  body text NOT NULL,
  mood_tag text NOT NULL DEFAULT 'milestone',
  what_helped text,
  photos text[] DEFAULT '{}',
  chapter_date date DEFAULT CURRENT_DATE,
  is_shared_to_explore boolean DEFAULT false,
  explore_status text DEFAULT NULL CHECK (explore_status IS NULL OR explore_status IN ('pending_review', 'live', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index on couple_id and chapter_date for timeline queries
CREATE INDEX IF NOT EXISTS idx_story_chapters_couple ON public.story_chapters(couple_id, chapter_date DESC);
CREATE INDEX IF NOT EXISTS idx_story_chapters_author ON public.story_chapters(author_user_id);

ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;

-- Couples can only read chapters belonging to their active pair
CREATE POLICY "Couples can read their own story chapters" ON public.story_chapters
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = story_chapters.couple_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

-- Couples can insert chapters for their active pair
CREATE POLICY "Couples can insert their own story chapters" ON public.story_chapters
  FOR INSERT TO authenticated
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = story_chapters.couple_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

-- Couples can update chapters in their active pair
CREATE POLICY "Couples can update their own story chapters" ON public.story_chapters
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = story_chapters.couple_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

-- Couples can delete chapters in their active pair
CREATE POLICY "Couples can delete their own story chapters" ON public.story_chapters
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pairs p
      WHERE p.id = story_chapters.couple_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );


-- 2. Create explore_stories table (public / community stories)
CREATE TABLE IF NOT EXISTS public.explore_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_chapter_id uuid REFERENCES public.story_chapters(id) ON DELETE SET NULL,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  situation_tags text[] DEFAULT '{}',
  body_anonymized text NOT NULL,
  what_helped_anonymized text,
  relationship_duration text DEFAULT 'Couple',
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'live', 'rejected')),
  helpful_count_private int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_explore_stories_status ON public.explore_stories(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_explore_stories_tags ON public.explore_stories USING GIN(situation_tags);

ALTER TABLE public.explore_stories ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view live explore stories
CREATE POLICY "Anyone authenticated can view live explore stories" ON public.explore_stories
  FOR SELECT TO authenticated
  USING (status = 'live' OR author_user_id = auth.uid());

-- Authenticated users can submit an explore story (starts in pending_review)
CREATE POLICY "Authenticated users can submit explore stories" ON public.explore_stories
  FOR INSERT TO authenticated
  WITH CHECK (author_user_id = auth.uid() AND status = 'pending_review');

-- Users can delete their own explore story
CREATE POLICY "Users can delete their own explore story" ON public.explore_stories
  FOR DELETE TO authenticated
  USING (author_user_id = auth.uid());


-- 3. Create story_saves table (user private bookmarks)
CREATE TABLE IF NOT EXISTS public.story_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  explore_story_id uuid REFERENCES public.explore_stories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, explore_story_id)
);

CREATE INDEX IF NOT EXISTS idx_story_saves_user ON public.story_saves(user_id, created_at DESC);

ALTER TABLE public.story_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own story saves" ON public.story_saves
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 4. Create story_helpful table (private to reader)
CREATE TABLE IF NOT EXISTS public.story_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  explore_story_id uuid REFERENCES public.explore_stories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, explore_story_id)
);

CREATE INDEX IF NOT EXISTS idx_story_helpful_user ON public.story_helpful(user_id);

ALTER TABLE public.story_helpful ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own helpful marks" ON public.story_helpful
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 5. Create story_reports table (flagging stories for moderation)
CREATE TABLE IF NOT EXISTS public.story_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explore_story_id uuid REFERENCES public.explore_stories(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_reports_status ON public.story_reports(status, created_at DESC);

ALTER TABLE public.story_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit story reports" ON public.story_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "Users can view their own reports" ON public.story_reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid());
