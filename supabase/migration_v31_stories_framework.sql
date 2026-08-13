-- Migration v31: Stories & Explore Knowledge Network
-- Supports two worlds: Our Stories (private couple archive) and Explore (public community stories)
-- Includes anonymous author controls, story_status, visibility, reactions, bookmarks, and responses.

-- 1. Add new columns to love_stories table
ALTER TABLE public.love_stories 
  ADD COLUMN IF NOT EXISTS story_status TEXT DEFAULT 'published', -- 'draft', 'published', 'archived'
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private', -- 'private' (Our Stories), 'community' (Explore)
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS author_display TEXT DEFAULT 'Anonymous Couple',
  ADD COLUMN IF NOT EXISTS problem_statement TEXT,
  ADD COLUMN IF NOT EXISTS quote_excerpt TEXT,
  ADD COLUMN IF NOT EXISTS what_happened TEXT,
  ADD COLUMN IF NOT EXISTS what_made_difficult TEXT,
  ADD COLUMN IF NOT EXISTS what_we_tried TEXT,
  ADD COLUMN IF NOT EXISTS where_are_we_now TEXT,
  ADD COLUMN IF NOT EXISTS what_to_tell_others TEXT,
  ADD COLUMN IF NOT EXISTS topic_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS relationship_duration TEXT,
  ADD COLUMN IF NOT EXISTS helped_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relate_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS perspective_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS going_through_count INT DEFAULT 0;

-- 2. Create story_saved table for private user bookmarks
CREATE TABLE IF NOT EXISTS public.story_saved (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_id uuid REFERENCES public.love_stories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, story_id)
);

ALTER TABLE public.story_saved ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved stories" ON public.story_saved
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Create story_reactions table
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_id uuid REFERENCES public.love_stories(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL, -- 'helped_me', 'relate', 'perspective', 'going_through'
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, story_id, reaction_type)
);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own story reactions" ON public.story_reactions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Create story_responses table
CREATE TABLE IF NOT EXISTS public.story_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.love_stories(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_display TEXT DEFAULT 'Anonymous Reader',
  content TEXT NOT NULL,
  shared_experience TEXT,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.story_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read story responses" ON public.story_responses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create story responses" ON public.story_responses
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
