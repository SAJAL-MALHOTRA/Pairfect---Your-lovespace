-- Migration v38: Add scheduled unseal date to love letters
ALTER TABLE public.love_letters 
  ADD COLUMN IF NOT EXISTS unseal_at timestamptz DEFAULT NULL;

-- NULL means immediately readable (backward compatible)
-- When set, the letter cannot be opened until unseal_at <= now()
COMMENT ON COLUMN public.love_letters.unseal_at IS 'Optional future date when the letter can be unsealed. NULL = immediately available.';
