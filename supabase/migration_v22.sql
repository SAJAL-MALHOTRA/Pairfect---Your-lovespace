-- SQL Migration: Pair unlinking support and encryption backfill plan
-- Run in Supabase SQL Editor.

-- 1. Allow pairs to transition into a safe unlinked state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'pair_status'
      AND e.enumlabel = 'unlinked'
  ) THEN
    ALTER TYPE pair_status ADD VALUE 'unlinked';
  END IF;
END $$;

-- 2. Keep notification_settings available for fresh installs
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_settings jsonb
  DEFAULT '{"partner_check_in": true, "new_gratitude": true}'::jsonb;

-- 3. Permit admin/server-side unlinking while still blocking arbitrary pair tampering
CREATE OR REPLACE FUNCTION public.prevent_pair_id_tampering()
RETURNS trigger AS $$
BEGIN
  IF OLD.user_a_id != NEW.user_a_id
     OR OLD.invite_code != NEW.invite_code THEN
    IF NOT (
      NEW.status = 'unlinked'
      AND OLD.user_b_id IS NOT NULL
      AND NEW.user_b_id IS NULL
      AND (NEW.user_a_id = OLD.user_a_id OR NEW.user_a_id = OLD.user_b_id)
    ) THEN
      RAISE EXCEPTION 'Cannot modify core pair identity fields';
    END IF;
  END IF;

  IF OLD.user_b_id IS NOT NULL AND OLD.user_b_id != NEW.user_b_id THEN
    IF NOT (NEW.status = 'unlinked' AND NEW.user_b_id IS NULL) THEN
      RAISE EXCEPTION 'Cannot reassign an already-paired partner';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Encryption backfill plan
-- Existing love_letters.content and vibe_disputes/dispute text rows should be
-- re-encrypted from a one-off server-only script that has access to
-- APP_ENCRYPTION_KEY. The script should:
--   a) read legacy plaintext rows,
--   b) encrypt them with the same helper used by the API routes,
--   c) write the encrypted values back,
--   d) verify rows now begin with the "enc:" prefix.

NOTIFY pgrst, 'reload schema';
