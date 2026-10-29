-- DevLingo: add learner progress for Supabase Auth
-- Safe additive migration for the existing schema; does not recreate existing learning tables.
-- Run once in Supabase SQL Editor after reviewing.

create table if not exists public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  completed text[] not null default '{}',
  streak integer not null default 0 check (streak >= 0),
  last_day date,
  updated_at timestamptz not null default now()
);

alter table public.learner_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'learner_progress'
      and policyname = 'Learners can read own progress'
  ) then
    create policy "Learners can read own progress"
      on public.learner_progress
      for select to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'learner_progress'
      and policyname = 'Learners can insert own progress'
  ) then
    create policy "Learners can insert own progress"
      on public.learner_progress
      for insert to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'learner_progress'
      and policyname = 'Learners can update own progress'
  ) then
    create policy "Learners can update own progress"
      on public.learner_progress
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Intentionally no anon policies: anonymous visitors cannot read/write learner progress.
