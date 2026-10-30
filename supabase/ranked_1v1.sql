-- DevLingo Ranked 1v1
-- Additive migration for the existing Supabase schema.
-- Run this file in Supabase SQL Editor. It does not modify learning tables or learner_progress.

begin;

create table if not exists public.rank_matches (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'completed', 'forfeit', 'cancelled')),
  lesson_xp integer not null check (lesson_xp > 0),
  winner_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (status = 'active' and finished_at is null and settled_at is null and winner_id is null)
    or
    (status in ('completed', 'forfeit') and finished_at is not null and settled_at is not null and winner_id is not null)
    or
    (status = 'cancelled' and settled_at is not null)
  )
);

create table if not exists public.rank_match_players (
  match_id uuid not null references public.rank_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  result text check (result in ('winner', 'loser', 'draw', 'forfeit')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  xp_before integer check (xp_before >= 0),
  xp_change integer,
  xp_after integer check (xp_after >= 0),
  primary key (match_id, user_id),
  check (
    (result is null and finished_at is null and xp_before is null and xp_change is null and xp_after is null)
    or
    (result is not null and finished_at is not null and xp_before is not null and xp_change is not null and xp_after is not null)
  )
);

create table if not exists public.rank_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'waiting'
    check (status in ('waiting', 'matched', 'cancelled', 'expired')),
  match_id uuid references public.rank_matches(id) on delete set null,
  created_at timestamptz not null default now(),
  matched_at timestamptz,
  cancelled_at timestamptz,
  check (
    (status = 'waiting' and match_id is null and matched_at is null and cancelled_at is null)
    or
    (status = 'matched' and match_id is not null and matched_at is not null and cancelled_at is null)
    or
    (status in ('cancelled', 'expired') and cancelled_at is not null)
  )
);

create table if not exists public.rank_history (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.rank_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  result text not null check (result in ('winner', 'loser', 'draw', 'forfeit')),
  xp_before integer not null check (xp_before >= 0),
  xp_change integer not null,
  xp_after integer not null check (xp_after >= 0),
  opponent_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz not null default now(),
  constraint rank_history_match_user_unique unique (match_id, user_id)
);

create unique index if not exists rank_queue_one_waiting_per_user
  on public.rank_queue(user_id)
  where status = 'waiting';

create index if not exists rank_queue_lesson_waiting_created
  on public.rank_queue(lesson_id, created_at)
  where status = 'waiting';

create index if not exists rank_matches_lesson_created
  on public.rank_matches(lesson_id, created_at desc);

create index if not exists rank_match_players_user_started
  on public.rank_match_players(user_id, started_at desc);

create index if not exists rank_history_user_completed
  on public.rank_history(user_id, completed_at desc);

alter table public.rank_matches enable row level security;
alter table public.rank_match_players enable row level security;
alter table public.rank_queue enable row level security;
alter table public.rank_history enable row level security;

-- SECURITY DEFINER helper avoids recursive RLS when checking match participation.
create or replace function public.is_rank_match_participant(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rank_match_players p
    where p.match_id = p_match_id
      and p.user_id = auth.uid()
  );
$$;

revoke all on function public.is_rank_match_participant(uuid) from public;
grant execute on function public.is_rank_match_participant(uuid) to authenticated;

-- Players can read matches and both player records for matches they participate in.
drop policy if exists "Players can read own ranked matches" on public.rank_matches;
create policy "Players can read own ranked matches"
  on public.rank_matches
  for select to authenticated
  using (public.is_rank_match_participant(id));

drop policy if exists "Participants can read ranked match players" on public.rank_match_players;
create policy "Participants can read ranked match players"
  on public.rank_match_players
  for select to authenticated
  using (public.is_rank_match_participant(match_id));

-- A learner can only inspect their own queue entry.
drop policy if exists "Learners can read own rank queue" on public.rank_queue;
create policy "Learners can read own rank queue"
  on public.rank_queue
  for select to authenticated
  using (user_id = auth.uid());

-- A learner can only inspect their own rank history.
drop policy if exists "Learners can read own rank history" on public.rank_history;
create policy "Learners can read own rank history"
  on public.rank_history
  for select to authenticated
  using (user_id = auth.uid());

-- No direct INSERT/UPDATE/DELETE policies are granted to browser clients.
-- Matchmaking and XP settlement must be performed by trusted server-side code
-- or SECURITY DEFINER RPC functions, never by client-supplied winner/XP values.


-- Atomic matchmaking: serialize queue operations per lesson to prevent duplicate pairings.
create or replace function public.join_rank_queue(p_user_id uuid, p_lesson_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson public.lessons%rowtype;
  v_content jsonb;
  v_lesson_xp integer;
  v_required_xp integer;
  v_queue_id uuid;
  v_previous_key text;
  v_xp integer;
  v_completed text[];
  v_existing public.rank_queue%rowtype;
  v_opponent public.rank_queue%rowtype;
  v_match_id uuid;
  v_now timestamptz := clock_timestamp();
begin
  if p_user_id is null or p_lesson_key is null or length(trim(p_lesson_key)) = 0 then
    raise exception 'ข้อมูลผู้เล่นหรือบทเรียนไม่ถูกต้อง' using errcode = '22023';
  end if;

  -- Acquire locks in a consistent order: player first, then lesson.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));
  perform pg_advisory_xact_lock(hashtextextended(p_lesson_key, 0));

  select l.*
    into v_lesson
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where l.published = true
    and c.published = true
    and c.title = 'Everyday English Path'
    and coalesce(l.content->>'lesson_key', l.id::text) = p_lesson_key
  limit 1;

  v_content := v_lesson.content;

  if v_lesson.id is null then
    raise exception 'ไม่พบบทเรียนหรือบทเรียนยังไม่เปิดให้ใช้งาน' using errcode = 'P0002';
  end if;

  v_lesson_xp := coalesce(nullif(v_content->>'xp', '')::integer, 0);
  v_required_xp := coalesce(nullif(v_content->>'required_xp', '')::integer, 0);
  if v_lesson_xp <= 0 then
    raise exception 'บทเรียนนี้ยังไม่ได้กำหนด XP สำหรับ Ranked' using errcode = '22023';
  end if;

  select coalesce(lp.xp, 0), coalesce(lp.completed, '{}')
    into v_xp, v_completed
  from public.learner_progress lp
  where lp.user_id = p_user_id;
  if not found then
    v_xp := 0;
    v_completed := '{}';
  end if;

  if v_xp < v_lesson_xp then
    raise exception 'XP ไม่เพียงพอสำหรับเข้า Ranked ของบทเรียนนี้' using errcode = 'P0001';
  end if;

  -- Check lesson progression using the preceding lesson in the same course.
  select coalesce(prev.content->>'lesson_key', prev.id::text)
    into v_previous_key
  from public.lessons prev
  where prev.course_id = v_lesson.course_id
    and prev.position < v_lesson.position
  order by prev.position desc
  limit 1;

  if v_previous_key is not null and not (v_previous_key = any(v_completed)) then
    raise exception 'กรุณาผ่านบทเรียนก่อนหน้าก่อนเข้า Ranked' using errcode = 'P0001';
  end if;

  if v_xp < v_required_xp then
    raise exception 'XP ยังไม่ถึงเกณฑ์ปลดล็อกบทเรียนนี้' using errcode = 'P0001';
  end if;

  select * into v_existing
  from public.rank_queue
  where user_id = p_user_id and status = 'waiting'
  for update;

  if found then
    if v_existing.lesson_id <> v_lesson.id then
      raise exception 'คุณมีคิว Ranked ของบทเรียนอื่นอยู่แล้ว' using errcode = 'P0001';
    end if;
    return jsonb_build_object('status', 'waiting', 'queue_id', v_existing.id);
  end if;

  select * into v_opponent
  from public.rank_queue
  where lesson_id = v_lesson.id
    and status = 'waiting'
    and user_id <> p_user_id
  order by created_at, id
  for update skip locked
  limit 1;

  if found then
    insert into public.rank_matches (lesson_id, lesson_xp, status, started_at)
    values (v_lesson.id, v_lesson_xp, 'active', v_now)
    returning id into v_match_id;

    insert into public.rank_match_players (match_id, user_id, started_at)
    values
      (v_match_id, v_opponent.user_id, v_now),
      (v_match_id, p_user_id, v_now);

    update public.rank_queue
    set status = 'matched', match_id = v_match_id, matched_at = v_now
    where id = v_opponent.id;

    insert into public.rank_queue (user_id, lesson_id, status, match_id, created_at, matched_at)
    values (p_user_id, v_lesson.id, 'matched', v_match_id, v_now, v_now);

    return jsonb_build_object('status', 'matched', 'match_id', v_match_id);
  end if;

  insert into public.rank_queue (user_id, lesson_id, status, created_at)
  values (p_user_id, v_lesson.id, 'waiting', v_now)
  returning id into v_queue_id;

  return jsonb_build_object('status', 'waiting', 'queue_id', v_queue_id);
end;
$$;

create or replace function public.cancel_rank_queue(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue_id uuid;
begin
  update public.rank_queue
  set status = 'cancelled', cancelled_at = clock_timestamp()
  where user_id = p_user_id and status = 'waiting'
  returning id into v_queue_id;

  if v_queue_id is null then
    return jsonb_build_object('status', 'not_waiting');
  end if;
  return jsonb_build_object('status', 'cancelled', 'queue_id', v_queue_id);
end;
$$;

revoke all on function public.join_rank_queue(uuid, text) from public, anon, authenticated;
revoke all on function public.cancel_rank_queue(uuid) from public, anon, authenticated;
grant execute on function public.join_rank_queue(uuid, text) to service_role;
grant execute on function public.cancel_rank_queue(uuid) to service_role;

commit;
