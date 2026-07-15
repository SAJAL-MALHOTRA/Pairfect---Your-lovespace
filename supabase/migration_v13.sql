-- Migration v13: Global Love Stories / Blogs Feature

-- =====================================================================
-- 1. TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS love_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES pairs(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  cover_image_url text,
  likes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE love_stories ENABLE ROW LEVEL SECURITY;

-- Reading is public to all authenticated users of the platform
CREATE POLICY "Authenticated users can read all love stories" ON love_stories
  FOR SELECT TO authenticated USING (true);

-- Inserting is allowed for any authenticated user belonging to a pair
CREATE POLICY "Authenticated users can create love stories" ON love_stories
  FOR INSERT TO authenticated WITH CHECK (
    pair_id IN (SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid())
  );

-- Updating/deleting is restricted to the original author
CREATE POLICY "Authors can update their own love stories" ON love_stories
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their own love stories" ON love_stories
  FOR DELETE TO authenticated USING (author_id = auth.uid());
