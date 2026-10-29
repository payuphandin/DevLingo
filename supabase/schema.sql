-- DevLingo schema
-- Review against the current Supabase schema before running. CREATE TABLE IF NOT EXISTS does not alter existing tables.
create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level text,
  category text,
  lesson_count integer not null default 0,
  estimated_minutes integer,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  content jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  estimated_minutes integer,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  prompt text not null,
  english text,
  question_type text not null default 'multiple_choice',
  explanation text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  position integer not null default 0
);
create table if not exists public.question_answer_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  answer_key jsonb not null
);
create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  meaning_th text not null,
  pronunciation text,
  example text,
  example_th text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.lesson_vocabulary (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  primary key (lesson_id, vocabulary_id)
);

-- Each authenticated learner has one durable progress record.
create table if not exists public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  completed text[] not null default '{}',
  streak integer not null default 0 check (streak >= 0),
  last_day date,
  updated_at timestamptz not null default now()
);

create index if not exists idx_lessons_course_position on public.lessons(course_id, position);
create index if not exists idx_exercises_lesson_position on public.exercises(lesson_id, position);
create index if not exists idx_questions_exercise_position on public.questions(exercise_id, position);
create index if not exists idx_question_options_question_position on public.question_options(question_id, position);
create index if not exists idx_vocabulary_word on public.vocabulary(word);

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.exercises enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_answer_keys enable row level security;
alter table public.vocabulary enable row level security;
alter table public.lesson_vocabulary enable row level security;
alter table public.learner_progress enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='Public can read published courses') then
    create policy "Public can read published courses" on public.courses for select to anon, authenticated using (published = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='lessons' and policyname='Public can read published lessons') then
    create policy "Public can read published lessons" on public.lessons for select to anon, authenticated using (published = true and exists (select 1 from public.courses c where c.id=course_id and c.published=true));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='exercises' and policyname='Public can read exercises in published lessons') then
    create policy "Public can read exercises in published lessons" on public.exercises for select to anon, authenticated using (exists (select 1 from public.lessons l join public.courses c on c.id=l.course_id where l.id=lesson_id and l.published=true and c.published=true));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='questions' and policyname='Public can read questions in published lessons') then
    create policy "Public can read questions in published lessons" on public.questions for select to anon, authenticated using (exists (select 1 from public.exercises e join public.lessons l on l.id=e.lesson_id join public.courses c on c.id=l.course_id where e.id=exercise_id and l.published=true and c.published=true));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='question_options' and policyname='Public can read options for published questions') then
    create policy "Public can read options for published questions" on public.question_options for select to anon, authenticated using (exists (select 1 from public.questions q join public.exercises e on e.id=q.exercise_id join public.lessons l on l.id=e.lesson_id join public.courses c on c.id=l.course_id where q.id=question_id and l.published=true and c.published=true));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='vocabulary' and policyname='Public can read published vocabulary') then
    create policy "Public can read published vocabulary" on public.vocabulary for select to anon, authenticated using (published=true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='lesson_vocabulary' and policyname='Public can read links for published lessons') then
    create policy "Public can read links for published lessons" on public.lesson_vocabulary for select to anon, authenticated using (exists (select 1 from public.lessons l join public.courses c on c.id=l.course_id where l.id=lesson_id and l.published=true and c.published=true));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='learner_progress' and policyname='Learners can read own progress') then
    create policy "Learners can read own progress" on public.learner_progress for select to authenticated using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='learner_progress' and policyname='Learners can insert own progress') then
    create policy "Learners can insert own progress" on public.learner_progress for insert to authenticated with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='learner_progress' and policyname='Learners can update own progress') then
    create policy "Learners can update own progress" on public.learner_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- No public read policy for question_answer_keys: never expose answer keys to browser clients.
