-- Migration v5: Riddle Night Schema and Seeds

-- =====================================================================
-- 1. CREATE TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.riddles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  difficulty text DEFAULT 'medium' NOT NULL, -- easy, medium, hard
  category text NOT NULL -- wordplay, logic, math, lateral-thinking
);

CREATE TABLE IF NOT EXISTS public.riddle_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  riddle_id uuid REFERENCES public.riddles(id) ON DELETE CASCADE NOT NULL,
  timer_seconds int, -- null = no timer
  status text DEFAULT 'active' NOT NULL, -- active, revealed
  started_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.riddle_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.riddle_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  answer_text text NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id) -- one answer per user per session
);

-- =====================================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE public.riddles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riddle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riddle_answers ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. RLS POLICIES
-- =====================================================================

-- riddles: Read-only for authenticated users
CREATE POLICY "Allow authenticated users to select riddles"
  ON public.riddles FOR SELECT USING (true);

-- riddle_sessions
CREATE POLICY "Users can view sessions for their pair"
  ON public.riddle_sessions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = riddle_sessions.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert sessions for their active pair"
  ON public.riddle_sessions FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
        AND pairs.status = 'active'
    )
  );

CREATE POLICY "Users can update sessions for their active pair"
  ON public.riddle_sessions FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = riddle_sessions.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

-- riddle_answers
CREATE POLICY "Users can view answers for their pair"
  ON public.riddle_answers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.riddle_sessions s
      JOIN public.pairs p ON p.id = s.pair_id
      WHERE s.id = riddle_answers.session_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert answers for their active pair"
  ON public.riddle_answers FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.riddle_sessions s
      JOIN public.pairs p ON p.id = s.pair_id
      WHERE s.id = session_id
        AND (p.user_a_id = auth.uid() OR p.user_b_id = auth.uid())
        AND p.status = 'active'
    )
  );

-- =====================================================================
-- 4. SEED RIDDLES DATA (35 Public Domain Riddles)
-- =====================================================================

INSERT INTO public.riddles (question, answer, difficulty, category) VALUES
('The more you take, the more you leave behind. What am I?', 'Footsteps', 'easy', 'lateral-thinking'),
('The wetter it gets, the more it dries. What is it?', 'A towel', 'easy', 'wordplay'),
('A man is looking at a photo of someone. His friend asks who it is. He says, "Brothers and sisters I have none, but this man''s father is my father''s son." Who is in the photo?', 'His son', 'hard', 'logic'),
('What has keys but no locks, space but no room, and you can enter but not go inside?', 'A keyboard', 'medium', 'wordplay'),
('What is full of holes but still holds water?', 'A sponge', 'easy', 'wordplay'),
('What has to be broken before you can use it?', 'An egg', 'easy', 'lateral-thinking'),
('I am tall when I am young, and I am short when I am old. What am I?', 'A candle', 'easy', 'lateral-thinking'),
('What month of the year has 28 days?', 'All of them', 'easy', 'logic'),
('What is always in front of you but can''t be seen?', 'The future', 'easy', 'lateral-thinking'),
('There is a one-story house in which everything is yellow. Yellow walls, yellow doors, yellow furniture. What color are the stairs?', 'There are no stairs (one-story house)', 'medium', 'logic'),
('What can you break, even if you never pick it up or touch it?', 'A promise', 'easy', 'lateral-thinking'),
('What goes up but never comes down?', 'Your age', 'easy', 'logic'),
('A man who was outside in the rain without an umbrella or hat didn''t get a single hair on his head wet. Why?', 'He was bald', 'easy', 'lateral-thinking'),
('What has hands but cannot clap?', 'A clock', 'easy', 'wordplay'),
('What has a head and a tail but no body?', 'A coin', 'easy', 'wordplay'),
('What building has the most stories?', 'The library', 'medium', 'wordplay'),
('It belongs to you, but other people use it more than you do. What is it?', 'Your name', 'medium', 'logic'),
('What has a neck but no head?', 'A bottle', 'easy', 'wordplay'),
('I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', 'An echo', 'medium', 'lateral-thinking'),
('What has one eye but cannot see?', 'A needle', 'easy', 'wordplay'),
('What has a thumb and four fingers, but is not a hand?', 'A glove', 'easy', 'wordplay'),
('What has legs, but doesn''t walk?', 'A table', 'easy', 'wordplay'),
('What can you catch, but not throw?', 'A cold', 'easy', 'lateral-thinking'),
('What runs all around a backyard, yet never moves?', 'A fence', 'medium', 'wordplay'),
('If you feed me, I live. If you give me water, I die. What am I?', 'Fire', 'medium', 'logic'),
('What has a bottom at the top?', 'Your legs', 'medium', 'wordplay'),
('What is so fragile that saying its name breaks it?', 'Silence', 'hard', 'lateral-thinking'),
('What is black when you buy it, red when you use it, and gray when you throw it away?', 'Charcoal', 'hard', 'logic'),
('I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?', 'A map', 'medium', 'lateral-thinking'),
('What can travel around the world while staying in a corner?', 'A stamp', 'medium', 'wordplay'),
('Which word in the dictionary is spelled incorrectly?', 'Incorrectly', 'easy', 'wordplay'),
('What has words, but never speaks?', 'A book', 'easy', 'wordplay'),
('What runs but never walks, murmurs but never talks, has a bed but never sleeps, has a mouth but never eats?', 'A river', 'hard', 'lateral-thinking'),
('What kind of band never plays music?', 'A rubber band', 'easy', 'wordplay'),
('The person who makes it has no need of it; the person who buys it has no use for it. The person who uses it can neither see nor feel it. What is it?', 'A coffin', 'hard', 'logic');
