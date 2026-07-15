-- Migration v14: Gratitude Jar Feature

-- =====================================================================
-- 1. TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS gratitude_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES pairs(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE gratitude_notes ENABLE ROW LEVEL SECURITY;

-- Both partners in the pair can read all gratitude notes
CREATE POLICY "Partners can read gratitude notes" ON gratitude_notes
  FOR SELECT TO authenticated USING (
    pair_id IN (SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid())
  );

-- Any authenticated user belonging to a pair can insert notes
CREATE POLICY "Partners can create gratitude notes" ON gratitude_notes
  FOR INSERT TO authenticated WITH CHECK (
    pair_id IN (SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid())
  );

-- Authors can delete their own gratitude notes
CREATE POLICY "Authors can delete gratitude notes" ON gratitude_notes
  FOR DELETE TO authenticated USING (author_id = auth.uid());
