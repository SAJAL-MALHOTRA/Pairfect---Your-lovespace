-- Migration V17: Add session logs tracking columns to focus_logs table
ALTER TABLE public.focus_logs 
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT TRUE;
