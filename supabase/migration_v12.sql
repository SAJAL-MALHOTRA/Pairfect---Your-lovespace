-- Migration v12: Virtual Photobooth Feature

-- =====================================================================
-- 1. TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS photobooth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES pairs(id),
  filter_applied text DEFAULT 'none',
  status text DEFAULT 'waiting', -- waiting, capturing, completed
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photobooth_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES photobooth_sessions(id),
  user_id uuid REFERENCES auth.users(id),
  photo_url text NOT NULL,
  captured_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photobooth_strips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES photobooth_sessions(id),
  combined_image_url text NOT NULL,
  caption text,
  saved_to_moments boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE photobooth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photobooth_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE photobooth_strips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pair members can manage photobooth_sessions" ON photobooth_sessions
  FOR ALL USING (
    pair_id IN (SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid())
  );

CREATE POLICY "Users can manage own photobooth_captures" ON photobooth_captures
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Pair members can read all photobooth_captures in session" ON photobooth_captures
  FOR SELECT USING (
    session_id IN (
      SELECT ps.id FROM photobooth_sessions ps
      JOIN pairs p ON p.id = ps.pair_id
      WHERE p.user_a_id = auth.uid() OR p.user_b_id = auth.uid()
    )
  );

CREATE POLICY "Pair members can manage photobooth_strips" ON photobooth_strips
  FOR ALL USING (
    session_id IN (
      SELECT ps.id FROM photobooth_sessions ps
      JOIN pairs p ON p.id = ps.pair_id
      WHERE p.user_a_id = auth.uid() OR p.user_b_id = auth.uid()
    )
  );
