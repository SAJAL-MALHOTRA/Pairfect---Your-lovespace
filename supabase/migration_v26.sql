-- Migration v26: Notification System, Pings, and Soft Streaks

-- 1. Create public.notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pair_id UUID REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('letter_sent', 'ping_sent', 'memory_added', 'gratitude_note', 'reaction_reply')),
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast recipient lookups
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_pair_id ON public.notifications(pair_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view notifications sent to or by them"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Users can insert notifications as sender"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update notification read status"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Add notifications to Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Publication might already contain table or not have permissions in standard dev env
  NULL;
END $$;

-- 2. Add Soft Streak & Ping rate limit columns to public.pairs
ALTER TABLE public.pairs
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_active_date DATE,
  ADD COLUMN IF NOT EXISTS paused_streak_value INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMP WITH TIME ZONE;

-- 3. Soft Streak Activity Recorder RPC
-- Calculates streaks with NO reset to zero — missed days pause the streak cleanly.
CREATE OR REPLACE FUNCTION public.record_pair_activity(p_pair_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pair RECORD;
  v_today DATE := CURRENT_DATE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_pair FROM public.pairs WHERE id = p_pair_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pair not found');
  END IF;

  -- 1. If activity already logged today, keep streak unchanged
  IF v_pair.last_active_date = v_today THEN
    RETURN jsonb_build_object(
      'success', true, 
      'current_streak', v_pair.current_streak,
      'is_paused', v_pair.is_paused,
      'status', 'already_logged_today'
    );
  END IF;

  -- 2. First activity ever
  IF v_pair.last_active_date IS NULL THEN
    UPDATE public.pairs
    SET 
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      last_active_date = v_today,
      is_paused = false,
      paused_streak_value = 0
    WHERE id = p_pair_id;

    RETURN jsonb_build_object('success', true, 'current_streak', 1, 'is_paused', false, 'status', 'started');
  END IF;

  -- 3. Consecutive day activity (yesterday -> today)
  IF v_pair.last_active_date = (v_today - INTERVAL '1 day')::DATE THEN
    IF v_pair.is_paused THEN
      -- Unpause and resume from paused value + 1
      UPDATE public.pairs
      SET 
        current_streak = v_pair.paused_streak_value + 1,
        longest_streak = GREATEST(v_pair.longest_streak, v_pair.paused_streak_value + 1),
        last_active_date = v_today,
        is_paused = false,
        paused_streak_value = 0
      WHERE id = p_pair_id;

      RETURN jsonb_build_object('success', true, 'current_streak', v_pair.paused_streak_value + 1, 'is_paused', false, 'status', 'resumed');
    ELSE
      -- Standard increment
      UPDATE public.pairs
      SET 
        current_streak = v_pair.current_streak + 1,
        longest_streak = GREATEST(v_pair.longest_streak, v_pair.current_streak + 1),
        last_active_date = v_today,
        is_paused = false
      WHERE id = p_pair_id;

      RETURN jsonb_build_object('success', true, 'current_streak', v_pair.current_streak + 1, 'is_paused', false, 'status', 'incremented');
    END IF;
  END IF;

  -- 4. Missed 1+ days -> PAUSE streak (never reset to 0!)
  UPDATE public.pairs
  SET 
    paused_streak_value = GREATEST(v_pair.current_streak, v_pair.paused_streak_value),
    is_paused = true,
    last_active_date = v_today
  WHERE id = p_pair_id;

  RETURN jsonb_build_object(
    'success', true, 
    'current_streak', GREATEST(v_pair.current_streak, v_pair.paused_streak_value), 
    'is_paused', true, 
    'status', 'paused'
  );
END;
$$;
