-- Migration v30: Add optional description column to shared_moments
ALTER TABLE public.shared_moments
  ADD COLUMN IF NOT EXISTS description text;
