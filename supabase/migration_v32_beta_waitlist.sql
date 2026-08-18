-- Migration v32: Create beta waitlist table
CREATE TABLE IF NOT EXISTS public.beta_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow public insert to waitlist
CREATE POLICY "Allow public waitlist submissions" 
  ON public.beta_waitlist 
  FOR INSERT 
  WITH CHECK (true);

-- Allow service role / authenticated admins to view waitlist
CREATE POLICY "Allow select for authenticated users" 
  ON public.beta_waitlist 
  FOR SELECT 
  TO authenticated 
  USING (true);
