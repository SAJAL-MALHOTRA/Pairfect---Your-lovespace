-- SQL Migration: Add notification_settings column to users table
-- Copy and run this script in your Supabase Dashboard SQL Editor.

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"partner_check_in": true, "new_gratitude": true}'::jsonb;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
