-- Migration v15: Enforce Cascade Deletes on IQ Duels and Photobooth

-- =====================================================================
-- 1. IQ DUELS CASCADE CONSTRAINTS
-- =====================================================================

-- iq_duels -> pairs
ALTER TABLE iq_duels 
  DROP CONSTRAINT IF EXISTS iq_duels_pair_id_fkey,
  ADD CONSTRAINT iq_duels_pair_id_fkey 
    FOREIGN KEY (pair_id) REFERENCES pairs(id) ON DELETE CASCADE;

-- iq_duel_answers -> iq_duels
ALTER TABLE iq_duel_answers 
  DROP CONSTRAINT IF EXISTS iq_duel_answers_duel_id_fkey,
  ADD CONSTRAINT iq_duel_answers_duel_id_fkey 
    FOREIGN KEY (duel_id) REFERENCES iq_duels(id) ON DELETE CASCADE;

-- iq_duel_answers -> auth.users
ALTER TABLE iq_duel_answers 
  DROP CONSTRAINT IF EXISTS iq_duel_answers_user_id_fkey,
  ADD CONSTRAINT iq_duel_answers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- iq_duel_answers -> iq_questions
ALTER TABLE iq_duel_answers 
  DROP CONSTRAINT IF EXISTS iq_duel_answers_question_id_fkey,
  ADD CONSTRAINT iq_duel_answers_question_id_fkey 
    FOREIGN KEY (question_id) REFERENCES iq_questions(id) ON DELETE CASCADE;

-- iq_duel_results -> iq_duels
ALTER TABLE iq_duel_results 
  DROP CONSTRAINT IF EXISTS iq_duel_results_duel_id_fkey,
  ADD CONSTRAINT iq_duel_results_duel_id_fkey 
    FOREIGN KEY (duel_id) REFERENCES iq_duels(id) ON DELETE CASCADE;

-- iq_duel_results -> auth.users
ALTER TABLE iq_duel_results 
  DROP CONSTRAINT IF EXISTS iq_duel_results_user_id_fkey,
  ADD CONSTRAINT iq_duel_results_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- =====================================================================
-- 2. PHOTOBOOTH CASCADE CONSTRAINTS
-- =====================================================================

-- photobooth_sessions -> pairs
ALTER TABLE photobooth_sessions 
  DROP CONSTRAINT IF EXISTS photobooth_sessions_pair_id_fkey,
  ADD CONSTRAINT photobooth_sessions_pair_id_fkey 
    FOREIGN KEY (pair_id) REFERENCES pairs(id) ON DELETE CASCADE;

-- photobooth_captures -> photobooth_sessions
ALTER TABLE photobooth_captures 
  DROP CONSTRAINT IF EXISTS photobooth_captures_session_id_fkey,
  ADD CONSTRAINT photobooth_captures_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES photobooth_sessions(id) ON DELETE CASCADE;

-- photobooth_captures -> auth.users
ALTER TABLE photobooth_captures 
  DROP CONSTRAINT IF EXISTS photobooth_captures_user_id_fkey,
  ADD CONSTRAINT photobooth_captures_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- photobooth_strips -> photobooth_sessions
ALTER TABLE photobooth_strips 
  DROP CONSTRAINT IF EXISTS photobooth_strips_session_id_fkey,
  ADD CONSTRAINT photobooth_strips_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES photobooth_sessions(id) ON DELETE CASCADE;
