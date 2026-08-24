-- Waitlist entries contain email addresses and should only be written by the
-- public endpoint. The service role bypasses RLS for administrative access.
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.beta_waitlist;
