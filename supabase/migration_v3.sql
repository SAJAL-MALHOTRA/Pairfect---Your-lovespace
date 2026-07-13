-- 1. Create public.avatar_outfits Table
create table public.avatar_outfits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  top_style text default 'tshirt' not null,
  top_color text default '#f43f5e' not null, -- hex color
  bottom_style text default 'pants' not null,
  bottom_color text default '#4b5563' not null, -- hex color
  shoes_style text default 'sneakers' not null,
  shoes_color text default '#111827' not null, -- hex color
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create public.polaroids Table
create table public.polaroids (
  id uuid default uuid_generate_v4() primary key,
  pair_id uuid references public.pairs(id) on delete cascade not null,
  image_path text not null, -- "pair_id/filename.png"
  caption text check (char_length(caption) <= 60),
  created_by uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.avatar_outfits enable row level security;
alter table public.polaroids enable row level security;

-- 4. Safety Triggers
create trigger polaroids_lock_pair
  before update on public.polaroids
  for each row execute procedure public.prevent_pair_id_change();


-- 5. RLS Policies

-- Avatar Outfits
create policy "Users can view avatar outfits for their pair"
  on public.avatar_outfits for select using (
    exists (
      select 1 from public.pairs
      where (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and (pairs.user_a_id = avatar_outfits.user_id or pairs.user_b_id = avatar_outfits.user_id)
        and pairs.status = 'active'
    )
  );

create policy "Users can manage their own avatar outfits"
  on public.avatar_outfits for all using (
    auth.uid() = user_id
  ) with check (
    auth.uid() = user_id
  );

-- Polaroids
create policy "Users can view polaroids for their active pair"
  on public.polaroids for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = polaroids.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can insert polaroids for their active pair"
  on public.polaroids for insert with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.pairs
      where pairs.id = pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can delete their own polaroids"
  on public.polaroids for delete using (
    auth.uid() = created_by
  );


-- 6. STORAGE BUCKET CONFIGURATION & RLS
-- Create polaroids bucket
insert into storage.buckets (id, name, public) 
values ('polaroids', 'polaroids', false)
on conflict (id) do nothing;

create policy "Users can view polaroids in their pair folder"
  on storage.objects for select using (
    bucket_id = 'polaroids' and (
      exists (
        select 1 from public.pairs
        where pairs.id::text = (storage.foldername(name))[1]
          and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
          and pairs.status = 'active'
      )
    )
  );

create policy "Users can upload polaroids to their pair folder"
  on storage.objects for insert with check (
    bucket_id = 'polaroids' and (
      exists (
        select 1 from public.pairs
        where pairs.id::text = (storage.foldername(name))[1]
          and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
          and pairs.status = 'active'
      )
    )
  );
