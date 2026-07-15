-- Migration v11: IQ Duel Feature Schema

-- =====================================================================
-- 1. CREATE TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS iq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_type text NOT NULL, -- 'pattern', 'logic', 'math'
  question_text text NOT NULL,
  options text[] NOT NULL,
  correct_answer text NOT NULL,
  difficulty int DEFAULT 1,
  time_limit_seconds int DEFAULT 20
);

CREATE TABLE IF NOT EXISTS iq_duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES pairs(id),
  question_ids uuid[] NOT NULL,
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS iq_duel_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid REFERENCES iq_duels(id),
  user_id uuid REFERENCES auth.users(id),
  question_id uuid REFERENCES iq_questions(id),
  answer_given text,
  is_correct boolean,
  time_taken_seconds numeric,
  answered_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iq_duel_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid REFERENCES iq_duels(id),
  user_id uuid REFERENCES auth.users(id),
  score int NOT NULL,
  estimated_iq int NOT NULL,
  playful_label text NOT NULL
);

-- =====================================================================
-- 2. ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE iq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE iq_duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE iq_duel_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iq_duel_results ENABLE ROW LEVEL SECURITY;

-- Questions: anyone can read
CREATE POLICY "Anyone can read iq_questions" ON iq_questions FOR SELECT USING (true);

-- Duels: pair members can read/write
CREATE POLICY "Pair members can manage iq_duels" ON iq_duels
  FOR ALL USING (
    pair_id IN (SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid())
  );

-- Answers: users can write their own
CREATE POLICY "Users can manage own iq_duel_answers" ON iq_duel_answers
  FOR ALL USING (user_id = auth.uid());

-- Results: pair members can read all results for a duel
CREATE POLICY "Users can read iq_duel_results" ON iq_duel_results
  FOR SELECT USING (
    duel_id IN (
      SELECT d.id FROM iq_duels d
      JOIN pairs p ON p.id = d.pair_id
      WHERE p.user_a_id = auth.uid() OR p.user_b_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own iq_duel_results" ON iq_duel_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- 3. SEED QUESTIONS
-- =====================================================================

INSERT INTO iq_questions (question_type, question_text, options, correct_answer, difficulty) VALUES
('pattern', '2, 4, 8, 16, ?', ARRAY['24','32','20','18'], '32', 2),
('pattern', '1, 1, 2, 3, 5, 8, ?', ARRAY['11','13','12','10'], '13', 2),
('pattern', '3, 6, 12, 24, ?', ARRAY['36','48','30','42'], '48', 2),
('pattern', 'A, C, E, G, ?', ARRAY['H','I','J','F'], 'I', 2),
('pattern', '5, 10, 20, 40, ?', ARRAY['60','70','80','50'], '80', 2),
('pattern', '100, 90, 81, 73, ?', ARRAY['66','65','64','67'], '66', 4),
('pattern', '2, 3, 5, 7, 11, ?', ARRAY['12','13','14','15'], '13', 3),
('pattern', '1, 4, 9, 16, 25, ?', ARRAY['30','36','32','34'], '36', 2),
('logic', 'All roses are flowers. Some flowers fade fast. Can we conclude some roses fade fast?', ARRAY['Yes','No','Cannot be determined','Only in summer'], 'Cannot be determined', 3),
('logic', 'If today is Monday, what day will it be 100 days from now?', ARRAY['Tuesday','Wednesday','Thursday','Friday'], 'Wednesday', 3),
('logic', 'A is taller than B. C is shorter than B. Who is the shortest?', ARRAY['A','B','C','Cannot tell'], 'C', 2),
('logic', 'If all Zibs are Zabs, and all Zabs are Zubs, are all Zibs Zubs?', ARRAY['Yes','No','Maybe','Not enough info'], 'Yes', 2),
('logic', 'Five people finish a race. John finishes before Mary but after Sam. Sam finishes last among these three. Who finishes first among the three?', ARRAY['John','Mary','Sam','Cannot tell'], 'Mary', 4),
('logic', 'A clock shows 3:15. What is the angle between the hour and minute hands?', ARRAY['0 degrees','7.5 degrees','15 degrees','30 degrees'], '7.5 degrees', 5),
('logic', 'If some cats are dogs, and all dogs bark, do some cats bark?', ARRAY['Yes','No','Cannot be determined','Only sometimes'], 'Cannot be determined', 3),
('logic', 'Two coins add up to 30 cents. One is not a nickel. What are the two coins?', ARRAY['Two dimes','A quarter and a nickel','A dime and a nickel','Three dimes'], 'A quarter and a nickel', 4),
('math', 'If a train travels 60km in 45 minutes, what is its speed in km/h?', ARRAY['80','75','90','60'], '80', 2),
('math', 'What is 15% of 240?', ARRAY['36','32','40','30'], '36', 2),
('math', 'A shirt costs $40 after a 20% discount. What was the original price?', ARRAY['$48','$50','$45','$52'], '$50', 3),
('math', 'If x + 5 = 12, what is 3x?', ARRAY['21','15','18','24'], '21', 2),
('math', 'What is the next prime number after 17?', ARRAY['18','19','21','23'], '19', 2),
('math', 'A rectangle has an area of 48 and a width of 6. What is its perimeter?', ARRAY['28','24','32','20'], '28', 3),
('math', 'If 3 workers finish a job in 12 days, how many days will 4 workers take?', ARRAY['9','8','10','6'], '9', 4),
('math', 'What is the square root of 169?', ARRAY['11','12','13','14'], '13', 1),
('math', 'A store marks up a $20 item by 25%. What is the new price?', ARRAY['$24','$25','$22','$26'], '$25', 2),
('math', 'If today is the 3rd and it was a Tuesday, what day is the 24th?', ARRAY['Monday','Tuesday','Wednesday','Sunday'], 'Tuesday', 3),
('pattern', 'Circle, Square, Triangle, Circle, Square, ?', ARRAY['Circle','Square','Triangle','Pentagon'], 'Triangle', 1),
('pattern', '7, 14, 28, 56, ?', ARRAY['84','112','98','70'], '112', 2),
('logic', 'If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?', ARRAY['100 minutes','5 minutes','20 minutes','1 minute'], '5 minutes', 4),
('math', 'What is 7 x 8 - 6 x 5?', ARRAY['26','30','24','28'], '26', 2),
('pattern', 'J, F, M, A, M, ?', ARRAY['J','A','S','O'], 'J', 3),
('logic', 'A farmer has 17 sheep, all but 9 die. How many are left?', ARRAY['8','9','17','0'], '9', 3),
('math', 'What is 1/4 + 1/3?', ARRAY['7/12','2/7','1/2','5/12'], '7/12', 3),
('pattern', '4, 9, 16, 25, 36, ?', ARRAY['42','49','45','48'], '49', 2);
