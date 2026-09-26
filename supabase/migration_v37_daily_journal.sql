-- Migration v37: Daily Journal — dual-lock couple journal

-- 1. Journal prompts table (curated daily questions)
CREATE TABLE IF NOT EXISTS public.journal_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text text NOT NULL,
  category text DEFAULT 'reflection',
  created_at timestamptz DEFAULT now()
);

-- 2. Journal entries table (one per user per day)
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id uuid REFERENCES public.journal_prompts(id),
  prompt_date date NOT NULL DEFAULT CURRENT_DATE,
  content text NOT NULL CHECK (char_length(content) <= 2000),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(pair_id, user_id, prompt_date)
);

-- 3. RLS
ALTER TABLE public.journal_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read prompts
CREATE POLICY "Anyone can read journal prompts"
  ON public.journal_prompts FOR SELECT
  USING (true);

-- Pair members can read entries (dual-lock handled in app logic)
CREATE POLICY "Pair members can read journal entries"
  ON public.journal_entries FOR SELECT
  USING (
    pair_id IN (
      SELECT id FROM public.pairs
      WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid())
      AND status = 'active'
    )
  );

-- Pair members can insert their own entries
CREATE POLICY "Pair members can insert journal entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND pair_id IN (
      SELECT id FROM public.pairs
      WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid())
      AND status = 'active'
    )
  );

-- 4. Seed 30 journal prompts
INSERT INTO public.journal_prompts (prompt_text, category) VALUES
  ('What is a small moment from this week you want to remember forever?', 'reflection'),
  ('What is something your partner did recently that made you smile?', 'gratitude'),
  ('If we could relive one day together, which would you choose?', 'nostalgia'),
  ('What is something you have been meaning to tell me but haven''t yet?', 'vulnerability'),
  ('What does ''home'' feel like to you right now?', 'feelings'),
  ('What is one thing I do that makes you feel truly seen?', 'love'),
  ('Describe our relationship in three words today.', 'reflection'),
  ('What is a dream you have for us in the next year?', 'future'),
  ('What song reminds you of us and why?', 'nostalgia'),
  ('What is one thing you are grateful for about us today?', 'gratitude'),
  ('If you could give our love story a title, what would it be?', 'creative'),
  ('What was the last thing that made you laugh together?', 'joy'),
  ('What is one fear you have about our relationship and how can we address it?', 'vulnerability'),
  ('What is your favorite way we spend time together?', 'love'),
  ('What is something new you learned about me recently?', 'discovery'),
  ('How did you feel when you woke up today?', 'feelings'),
  ('What is a tradition you want us to start?', 'future'),
  ('Write a one-sentence love note to your partner.', 'love'),
  ('What is something that challenged us recently and how did we handle it?', 'growth'),
  ('If we had an entire weekend with no plans, what would you want to do?', 'dreams'),
  ('What is the kindest thing someone has ever done for you?', 'gratitude'),
  ('What does trust look like in our relationship?', 'reflection'),
  ('What is one thing you admire about how your partner handles stress?', 'appreciation'),
  ('Describe a perfect evening together.', 'dreams'),
  ('What is a lesson our relationship has taught you?', 'growth'),
  ('What made today ordinary but beautiful?', 'mindfulness'),
  ('What is one boundary you want to set or maintain in our relationship?', 'vulnerability'),
  ('What is a childhood memory that shaped how you love?', 'nostalgia'),
  ('How do you feel right now, in this exact moment?', 'feelings'),
  ('What is the most important thing I should know about you today?', 'connection')
ON CONFLICT DO NOTHING;
