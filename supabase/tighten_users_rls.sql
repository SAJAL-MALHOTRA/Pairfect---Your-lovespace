-- SQL Migration: Tighten public.users RLS policies
-- Copy and run this script in your Supabase SQL Editor.

-- 1. Drop the permissive select policy
drop policy if exists "Users can view all users" on public.users;

-- 2. Create a tight select policy: a user can only view their own profile or their partner's profile
create policy "Users can view themselves and their partner"
  on public.users for select using (
    auth.uid() = id
    or exists (
      select 1 from public.pairs
      where (pairs.user_a_id = auth.uid() and pairs.user_b_id = users.id)
         or (pairs.user_b_id = auth.uid() and pairs.user_a_id = users.id)
    )
  );

-- 3. Reload schema cache
notify pgrst, 'reload schema';
