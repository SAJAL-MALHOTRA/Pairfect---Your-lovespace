-- SQL Migration: Couple's Focus Zone
-- Copy and run this script in your Supabase SQL Editor, then refresh your browser.

-- 1. Create focus_sessions table (For tracking active live focus states)
create table if not exists public.focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  pair_id uuid references public.pairs(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  status text not null, -- 'work', 'break', 'idle'
  label text, -- what they are studying
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  duration_seconds integer not null, -- session total length
  ends_at timestamp with time zone not null, -- calculation helper for remaining time
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_focus unique (user_id)
);

-- 2. Create focus_logs table (For historical logging/stats)
create table if not exists public.focus_logs (
  id uuid default uuid_generate_v4() primary key,
  pair_id uuid references public.pairs(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  label text,
  duration_minutes integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.focus_sessions enable row level security;
alter table public.focus_logs enable row level security;

-- 4. RLS Policies for focus_sessions
create policy "Users can view focus sessions of active pair"
  on public.focus_sessions for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = focus_sessions.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can manage their own focus session"
  on public.focus_sessions for all using (
    auth.uid() = user_id
  ) with check (
    auth.uid() = user_id
  );

-- 5. RLS Policies for focus_logs
create policy "Users can view focus logs of active pair"
  on public.focus_logs for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = focus_logs.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can insert focus logs for their active pair"
  on public.focus_logs for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.pairs
      where pairs.id = pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

-- 6. Trigger schema cache reload
notify pgrst, 'reload schema';
