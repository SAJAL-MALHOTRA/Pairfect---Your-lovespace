-- SQL Migration: Migrate to gratitude_entries with full history support
-- Copy and run this script in your Supabase Dashboard SQL Editor.

-- 1. Create gratitude_entries table
CREATE TABLE IF NOT EXISTS public.gratitude_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Partners can read gratitude entries" ON public.gratitude_entries
  FOR SELECT TO authenticated USING (
    pair_id IN (SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid())
  );

CREATE POLICY "Partners can create gratitude entries" ON public.gratitude_entries
  FOR INSERT TO authenticated WITH CHECK (
    pair_id IN (SELECT id FROM pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid())
  );

CREATE POLICY "Authors can delete gratitude entries" ON public.gratitude_entries
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 4. Copy existing data from public.gratitude_notes to public.gratitude_entries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gratitude_notes') THEN
    INSERT INTO public.gratitude_entries (id, pair_id, user_id, content, created_at)
    SELECT id, pair_id, author_id, message, created_at
    FROM public.gratitude_notes
    ON CONFLICT (id) DO NOTHING;
    
    -- Drop old table
    DROP TABLE public.gratitude_notes;
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
