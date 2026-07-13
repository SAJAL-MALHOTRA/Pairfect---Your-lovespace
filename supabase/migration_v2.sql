-- 1. Create public.quiz_questions Table
create table public.quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  pair_id uuid references public.pairs(id) on delete cascade not null,
  created_by uuid references public.users(id) on delete cascade not null,
  question_text text not null,
  correct_answer text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create public.quiz_guesses Table
create type guess_status as enum ('pending', 'correct', 'incorrect');

create table public.quiz_guesses (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.quiz_questions(id) on delete cascade not null,
  guessed_by uuid references public.users(id) on delete cascade not null,
  guess_text text not null,
  status guess_status default 'pending'::guess_status not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure only one guess per user per question
  unique (question_id, guessed_by)
);

-- 3. Create public.youtube_sessions Table (to persist state)
create table public.youtube_sessions (
  pair_id uuid references public.pairs(id) on delete cascade primary key,
  video_id text not null,
  last_time double precision default 0.0 not null,
  is_playing boolean default false not null,
  updated_by uuid references public.users(id) on delete cascade not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS
alter table public.quiz_questions enable row level security;
alter table public.quiz_guesses enable row level security;
alter table public.youtube_sessions enable row level security;

-- 5. Immutability & Safety Triggers
create trigger quiz_questions_lock_pair
  before update on public.quiz_questions
  for each row execute procedure public.prevent_pair_id_change();

create trigger youtube_sessions_lock_pair
  before update on public.youtube_sessions
  for each row execute procedure public.prevent_pair_id_change();


-- 6. GAME INTEGRITY TRIGGER (Prevents self-grading & guess-tampering)
create or replace function public.check_quiz_guess_update()
returns trigger as $$
declare
  q_creator uuid;
begin
  -- Get the creator of the question
  select created_by into q_creator from public.quiz_questions where id = NEW.question_id;

  -- A: If the guesser is updating their own guess
  if auth.uid() = NEW.guessed_by then
    -- Block guesser from grading themselves
    if OLD.status != NEW.status then
      raise exception 'You cannot grade your own guess';
    end if;
    -- Block guesser from modifying ownership keys
    if OLD.guessed_by != NEW.guessed_by or OLD.question_id != NEW.question_id then
      raise exception 'Cannot change guess ownership or question association';
    end if;
  end if;

  -- B: If the creator is updating (grading) the guess
  if auth.uid() = q_creator then
    -- Block creator from altering the partner's original text
    if OLD.guess_text != NEW.guess_text then
      raise exception 'Creators cannot modify your guess text';
    end if;
    -- Block creator from modifying ownership keys
    if OLD.guessed_by != NEW.guessed_by or OLD.question_id != NEW.question_id then
      raise exception 'Cannot change guess ownership or question association';
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger check_guess_changes
  before update on public.quiz_guesses
  for each row execute procedure public.check_quiz_guess_update();


-- 7. RLS Policies

-- Quiz Questions
create policy "Users can view quiz questions for their active pair"
  on public.quiz_questions for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = quiz_questions.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can insert quiz questions for their active pair"
  on public.quiz_questions for insert with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.pairs
      where pairs.id = pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can update/delete their own quiz questions"
  on public.quiz_questions for all using (
    auth.uid() = created_by
  ) with check (
    auth.uid() = created_by
  );

-- Quiz Guesses
create policy "Users can view quiz guesses for their pair"
  on public.quiz_guesses for select using (
    exists (
      select 1 from public.quiz_questions q
      join public.pairs p on p.id = q.pair_id
      where q.id = quiz_guesses.question_id
        and (p.user_a_id = auth.uid() or p.user_b_id = auth.uid())
    )
  );

create policy "Users can submit guesses for their partner's questions"
  on public.quiz_guesses for insert with check (
    auth.uid() = guessed_by and
    exists (
      select 1 from public.quiz_questions q
      where q.id = question_id
        and q.created_by != auth.uid() -- cannot guess own questions
    )
  );

create policy "Users can update guesses for their pair"
  on public.quiz_guesses for update using (
    exists (
      select 1 from public.quiz_questions q
      join public.pairs p on p.id = q.pair_id
      where q.id = quiz_guesses.question_id
        and (p.user_a_id = auth.uid() or p.user_b_id = auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.quiz_questions q
      join public.pairs p on p.id = q.pair_id
      where q.id = quiz_guesses.question_id
        and (p.user_a_id = auth.uid() or p.user_b_id = auth.uid())
    )
  );

-- YouTube Sessions
create policy "Users can view youtube session for their active pair"
  on public.youtube_sessions for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = youtube_sessions.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );

create policy "Users can all youtube session actions for their pair"
  on public.youtube_sessions for all using (
    exists (
      select 1 from public.pairs
      where pairs.id = youtube_sessions.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  ) with check (
    exists (
      select 1 from public.pairs
      where pairs.id = youtube_sessions.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );
