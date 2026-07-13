-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. CREATE public.users TABLE (links to auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  spotify_connected boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CREATE public.user_secrets TABLE (Securely isolated secrets)
create table public.user_secrets (
  user_id uuid references public.users(id) on delete cascade primary key,
  spotify_refresh_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CREATE public.pairs TABLE
create type pair_status as enum ('pending', 'active', 'archived');

create table public.pairs (
  id uuid default uuid_generate_v4() primary key,
  user_a_id uuid references public.users(id) on delete cascade not null,
  user_b_id uuid references public.users(id) on delete cascade,
  invite_code text unique not null,
  status pair_status default 'pending'::pair_status not null,
  started_dating_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. CREATE public.mood_logs TABLE
create type mood_type as enum (
  'joyful', 'content', 'neutral', 'tired', 'stressed', 
  'sad', 'anxious', 'excited', 'loved', 'distant'
);

create table public.mood_logs (
  id uuid default uuid_generate_v4() primary key,
  pair_id uuid references public.pairs(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  mood mood_type not null,
  mood_intensity integer not null check (mood_intensity >= 1 and mood_intensity <= 5),
  note text check (char_length(note) <= 280),
  spotify_track_id text,
  spotify_track_name text,
  spotify_artist_name text,
  spotify_album_art text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CREATE public.vibe_summaries TABLE
create type mood_trend_type as enum ('improving', 'stable', 'declining', 'mixed');

create table public.vibe_summaries (
  id uuid default uuid_generate_v4() primary key,
  pair_id uuid references public.pairs(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  summary_text text not null,
  mood_trend mood_trend_type not null,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. CREATE public.shared_moments TABLE
create table public.shared_moments (
  id uuid default uuid_generate_v4() primary key,
  pair_id uuid references public.pairs(id) on delete cascade not null,
  created_by uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  photo_url text, -- storage path key: "pair_id/filename"
  moment_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. AUTOMATIC USER SYNC TRIGGER
-- Syncs user metadata from auth.users to public.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 9. INVITE JOIN FLOW RPC (Bypasses SELECT block securely)
create or replace function public.join_pair_by_code(code text)
returns uuid as $$
declare
  target_pair_id uuid;
begin
  -- Update the pair table by setting user_b to the active user
  update public.pairs
  set user_b_id = auth.uid(), status = 'active'
  where invite_code = code 
    and status = 'pending' 
    and user_b_id is null 
    and user_a_id != auth.uid()
  returning id into target_pair_id;

  if target_pair_id is null then
    raise exception 'Invalid invite code or pair is not joinable';
  end if;

  return target_pair_id;
end;
$$ language plpgsql security definer;


-- 10. IMMUTABILITY TRIGGERS (Prevent column hijacking)

-- Lock key pair identity attributes
create or replace function public.prevent_pair_id_tampering()
returns trigger as $$
begin
  if OLD.user_a_id != NEW.user_a_id
     or OLD.invite_code != NEW.invite_code then
    raise exception 'Cannot modify core pair identity fields';
  end if;

  if OLD.user_b_id is not null and OLD.user_b_id != NEW.user_b_id then
    raise exception 'Cannot reassign an already-paired partner';
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger pairs_lock_identity
  before update on public.pairs
  for each row execute procedure public.prevent_pair_id_tampering();

-- Lock pair_id for mood logs & shared moments on update
create or replace function public.prevent_pair_id_change()
returns trigger as $$
begin
  if OLD.pair_id != NEW.pair_id then
    raise exception 'Cannot move a record to a different pair';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger mood_logs_lock_pair
  before update on public.mood_logs
  for each row execute procedure public.prevent_pair_id_change();

create trigger shared_moments_lock_pair
  before update on public.shared_moments
  for each row execute procedure public.prevent_pair_id_change();


-- 11. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.user_secrets enable row level security;
alter table public.pairs enable row level security;
alter table public.mood_logs enable row level security;
alter table public.vibe_summaries enable row level security;
alter table public.shared_moments enable row level security;

-- (NO POLICIES for user_secrets: client-side cannot select/update, only service role can access)

-- USERS Policies
create policy "Users can view all users"
  on public.users for select using (true);

create policy "Users can update their own profile"
  on public.users for update using (auth.uid() = id);

-- PAIRS Policies
create policy "Users can view pairs they are part of"
  on public.pairs for select using (
    auth.uid() = user_a_id or auth.uid() = user_b_id
  );

create policy "Users can create pairs as User A"
  on public.pairs for insert with check (
    auth.uid() = user_a_id
  );

create policy "Users can update pairs they are part of"
  on public.pairs for update using (
    auth.uid() = user_a_id or auth.uid() = user_b_id
  ) with check (
    auth.uid() = user_a_id or auth.uid() = user_b_id
  );

-- MOOD LOGS Policies
create policy "Users can view mood logs if in the active pair"
  on public.mood_logs for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = mood_logs.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can insert mood logs for their active pair"
  on public.mood_logs for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.pairs
      where pairs.id = pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can update their own mood logs"
  on public.mood_logs for update using (
    auth.uid() = user_id
  ) with check (
    auth.uid() = user_id
  );

-- VIBE SUMMARIES Policies (Read-only for clients, Server-side creates using Service Role)
create policy "Users can view summaries for their pair"
  on public.vibe_summaries for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = vibe_summaries.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
    )
  );

-- SHARED MOMENTS Policies
create policy "Users can view moments for their pair"
  on public.shared_moments for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = shared_moments.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
    )
  );

create policy "Users can insert moments for their active pair"
  on public.shared_moments for insert with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.pairs
      where pairs.id = pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can update/delete their own moments"
  on public.shared_moments for all using (
    auth.uid() = created_by
  ) with check (
    auth.uid() = created_by
  );


-- 12. STORAGE BUCKET CONFIGURATION & RLS
-- Note: Must be run on the storage schema or executed via SQL Editor
-- Create bucket if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('memories', 'memories', false)
on conflict (id) do nothing;

-- Storage Read Policy: Allow reading if folder name matches active pair
create policy "Users can view memories from their pair"
  on storage.objects for select using (
    bucket_id = 'memories' and (
      exists (
        select 1 from public.pairs
        where pairs.id::text = (storage.foldername(name))[1]
          and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
          and pairs.status = 'active'
      )
    )
  );

-- Storage Insert Policy: Allow upload if folder matches active pair
create policy "Users can upload memories to their pair folder"
  on storage.objects for insert with check (
    bucket_id = 'memories' and (
      exists (
        select 1 from public.pairs
        where pairs.id::text = (storage.foldername(name))[1]
          and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
          and pairs.status = 'active'
      )
    )
  );
