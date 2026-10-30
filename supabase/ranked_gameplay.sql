-- Ranked gameplay and atomic XP settlement migration
begin;

alter table public.rank_match_players
  add column if not exists score integer not null default 0 check (score >= 0),
  add column if not exists total_questions integer not null default 0 check (total_questions >= 0);

-- A player may finish answering before the opponent. Keep result/XP fields
-- null until the match is settled, but allow finished_at to be populated.
alter table public.rank_match_players
  drop constraint if exists rank_match_players_check;

alter table public.rank_match_players
  add constraint rank_match_players_check check (
    (result is null
      and xp_before is null
      and xp_change is null
      and xp_after is null)
    or
    (result is not null
      and finished_at is not null
      and xp_before is not null
      and xp_change is not null
      and xp_after is not null)
  );

create table if not exists public.rank_match_answers (
  match_id uuid not null,
  user_id uuid not null,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_position integer not null check (selected_position between 0 and 4),
  is_correct boolean not null,
  answered_at timestamptz not null default clock_timestamp(),
  primary key (match_id, user_id, question_id),
  foreign key (match_id, user_id)
    references public.rank_match_players(match_id, user_id) on delete cascade
);

create index if not exists rank_match_answers_player
  on public.rank_match_answers(match_id, user_id);

alter table public.rank_match_answers drop constraint if exists rank_match_answers_selected_position_check;
alter table public.rank_match_answers add constraint rank_match_answers_selected_position_check check (selected_position between 0 and 4);

alter table public.rank_match_answers enable row level security;

drop policy if exists "Participants can read own ranked answers" on public.rank_match_answers;
create policy "Participants can read own ranked answers"
  on public.rank_match_answers for select to authenticated
  using (user_id = auth.uid() and public.is_rank_match_participant(match_id));

create or replace function public.submit_rank_answer(
  p_user_id uuid,
  p_match_id uuid,
  p_question_id uuid,
  p_option_position integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.rank_matches%rowtype;
  v_player public.rank_match_players%rowtype;
  v_question_lesson uuid;
  v_correct_position integer;
  v_is_correct boolean;
  v_total integer;
  v_pass_score integer;
  v_answered integer;
  v_score integer;
  v_players_finished integer;
  v_p1 public.rank_match_players%rowtype;
  v_p2 public.rank_match_players%rowtype;
  v_winner uuid;
  v_loser uuid;
  v_winner_change integer;
  v_loser_before integer;
  v_winner_before integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_user_id is null or p_match_id is null or p_question_id is null
     or p_option_position is null or p_option_position < 0 or p_option_position > 4 then
    raise exception 'ข้อมูลคำตอบไม่ถูกต้อง' using errcode = '22023';
  end if;

  select * into v_match from public.rank_matches
   where id = p_match_id for update;
  if not found or v_match.status <> 'active' then
    raise exception 'การแข่งขันนี้ไม่ได้อยู่ในสถานะกำลังเล่น' using errcode = 'P0001';
  end if;

  select * into v_player from public.rank_match_players
   where match_id = p_match_id and user_id = p_user_id for update;
  if not found then
    raise exception 'คุณไม่ได้เป็นผู้เล่นในการแข่งขันนี้' using errcode = '42501';
  end if;
  if v_player.finished_at is not null then
    raise exception 'คุณส่งคำตอบครบแล้ว' using errcode = 'P0001';
  end if;

  select l.id into v_question_lesson
    from public.questions q
    join public.exercises e on e.id = q.exercise_id
    join public.lessons l on l.id = e.lesson_id
   where q.id = p_question_id
     and l.id = v_match.lesson_id
     and e.title = 'Practice quiz';
  if v_question_lesson is null then
    raise exception 'โจทย์นี้ไม่อยู่ในบทเรียนของการแข่งขัน' using errcode = '22023';
  end if;

  select (qak.answer_key->>'correct_option_position')::integer
    into v_correct_position
    from public.question_answer_keys qak
   where qak.question_id = p_question_id;
  if v_correct_position is null then
    raise exception 'ไม่พบเฉลยของคำถามนี้' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.question_options qo
     where qo.question_id = p_question_id and qo.position = p_option_position
  ) then
    raise exception 'ไม่พบตัวเลือกคำตอบนี้' using errcode = '22023';
  end if;

  v_is_correct := (p_option_position = v_correct_position);

  insert into public.rank_match_answers(match_id, user_id, question_id, selected_position, is_correct, answered_at)
  values (p_match_id, p_user_id, p_question_id, p_option_position, v_is_correct, v_now);

  select count(*)::integer into v_total
    from public.questions q
    join public.exercises e on e.id = q.exercise_id
   where e.lesson_id = v_match.lesson_id and e.title = 'Practice quiz';

  select count(*)::integer, count(*) filter (where is_correct)::integer
    into v_answered, v_score
    from public.rank_match_answers
   where match_id = p_match_id and user_id = p_user_id;

  if v_total <= 0 then
    raise exception 'บทเรียนนี้ไม่มีข้อสอบสำหรับ Ranked' using errcode = 'P0002';
  end if;
  v_pass_score := least(4, v_total);

  if v_answered = v_total then
    update public.rank_match_players
       set score = v_score, total_questions = v_total, finished_at = v_now
     where match_id = p_match_id and user_id = p_user_id;
  else
    update public.rank_match_players
       set score = v_score, total_questions = v_total
     where match_id = p_match_id and user_id = p_user_id;
  end if;

  select count(*)::integer into v_players_finished
    from public.rank_match_players
   where match_id = p_match_id and finished_at is not null;

  if v_players_finished = 2 then
    select * into v_p1 from public.rank_match_players
     where match_id = p_match_id order by started_at, user_id limit 1;
    select * into v_p2 from public.rank_match_players
     where match_id = p_match_id and user_id <> v_p1.user_id limit 1;

    if v_p1.score < v_pass_score and v_p2.score < v_pass_score then
      update public.rank_matches
         set status = 'cancelled', finished_at = v_now, settled_at = v_now
       where id = p_match_id;
      update public.rank_match_players
         set result = 'draw', xp_before = coalesce((select xp from public.learner_progress where user_id = rank_match_players.user_id), 0),
             xp_change = 0, xp_after = coalesce((select xp from public.learner_progress where user_id = rank_match_players.user_id), 0)
       where match_id = p_match_id;
      insert into public.rank_history(match_id,user_id,lesson_id,result,xp_before,xp_change,xp_after,opponent_id)
      values
        (p_match_id,v_p1.user_id,v_match.lesson_id,'draw',coalesce((select xp from public.learner_progress where user_id=v_p1.user_id),0),0,coalesce((select xp from public.learner_progress where user_id=v_p1.user_id),0),v_p2.user_id),
        (p_match_id,v_p2.user_id,v_match.lesson_id,'draw',coalesce((select xp from public.learner_progress where user_id=v_p2.user_id),0),0,coalesce((select xp from public.learner_progress where user_id=v_p2.user_id),0),v_p1.user_id)
      on conflict (match_id,user_id) do nothing;
    else
      if v_p1.score >= v_pass_score and v_p2.score >= v_pass_score then
        if v_p1.finished_at <= v_p2.finished_at then v_winner := v_p1.user_id; else v_winner := v_p2.user_id; end if;
      elsif v_p1.score >= v_pass_score then v_winner := v_p1.user_id;
      else v_winner := v_p2.user_id;
      end if;
      v_loser := case when v_winner = v_p1.user_id then v_p2.user_id else v_p1.user_id end;
      v_winner_change := round(v_match.lesson_xp * 1.5)::integer;

      insert into public.learner_progress(user_id,xp,completed,streak,last_day,updated_at)
      values (v_winner, v_winner_change, '{}', 0, null, v_now)
      on conflict (user_id) do update
        set xp = public.learner_progress.xp + v_winner_change, updated_at = v_now;
      insert into public.learner_progress(user_id,xp,completed,streak,last_day,updated_at)
      values (v_loser, 0, '{}', 0, null, v_now)
      on conflict (user_id) do nothing;

      select xp into v_winner_before from public.learner_progress where user_id = v_winner;
      v_winner_before := v_winner_before - v_winner_change;
      select xp into v_loser_before from public.learner_progress where user_id = v_loser;
      update public.learner_progress
         set xp = greatest(0, xp - v_match.lesson_xp), updated_at = v_now
       where user_id = v_loser;

      update public.rank_matches
         set status = 'completed', winner_id = v_winner, finished_at = v_now, settled_at = v_now
       where id = p_match_id;
      update public.rank_match_players
         set result = case when user_id = v_winner then 'winner' else 'loser' end,
             xp_before = case when user_id = v_winner then v_winner_before else v_loser_before end,
             xp_change = case when user_id = v_winner then v_winner_change else -least(v_loser_before, v_match.lesson_xp) end,
             xp_after = case when user_id = v_winner then v_winner_before + v_winner_change else greatest(0, v_loser_before - v_match.lesson_xp) end
       where match_id = p_match_id;
      insert into public.rank_history(match_id,user_id,lesson_id,result,xp_before,xp_change,xp_after,opponent_id)
      select p_match_id, p.user_id, v_match.lesson_id,
             case when p.user_id = v_winner then 'winner' else 'loser' end,
             p.xp_before, p.xp_change, p.xp_after,
             case when p.user_id = v_winner then v_loser else v_winner end
        from public.rank_match_players p where p.match_id = p_match_id
      on conflict (match_id,user_id) do nothing;
    end if;
  end if;

  return jsonb_build_object(
    'correct', v_is_correct,
    'score', v_score,
    'answered', v_answered,
    'total', v_total,
    'finished', (v_answered = v_total),
    'match_status', (select status from public.rank_matches where id = p_match_id)
  );
end;
$$;

revoke all on function public.submit_rank_answer(uuid,uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.submit_rank_answer(uuid,uuid,uuid,integer) to service_role;

-- End abandoned matches after 20 minutes so a disconnected opponent cannot
-- leave the other learner locked in an active match indefinitely.
create or replace function public.expire_rank_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.rank_matches%rowtype;
  v_p1 public.rank_match_players%rowtype;
  v_p2 public.rank_match_players%rowtype;
  v_finished_count integer;
  v_total integer;
  v_pass_score integer;
  v_winner uuid;
  v_loser uuid;
  v_winner_before integer;
  v_loser_before integer;
  v_winner_change integer;
  v_now timestamptz := clock_timestamp();
begin
  select * into v_match from public.rank_matches
   where id = p_match_id for update;
  if not found then
    raise exception 'ไม่พบการแข่งขันนี้' using errcode = 'P0002';
  end if;
  if v_match.status <> 'active' then
    return jsonb_build_object('status', v_match.status);
  end if;
  if v_now < v_match.started_at + interval '20 minutes' then
    return jsonb_build_object('status', 'active', 'expired', false);
  end if;

  select count(*)::integer into v_total
    from public.questions q
    join public.exercises e on e.id = q.exercise_id
   where e.lesson_id = v_match.lesson_id and e.title = 'Practice quiz';
  v_pass_score := least(4, v_total);

  select * into v_p1 from public.rank_match_players
   where match_id = p_match_id order by started_at, user_id limit 1;
  select * into v_p2 from public.rank_match_players
   where match_id = p_match_id and user_id <> v_p1.user_id limit 1;
  select count(*)::integer into v_finished_count
    from public.rank_match_players
   where match_id = p_match_id and finished_at is not null;

  if v_finished_count = 1 then
    if v_p1.finished_at is not null and v_p1.score >= v_pass_score then v_winner := v_p1.user_id;
    elsif v_p2.finished_at is not null and v_p2.score >= v_pass_score then v_winner := v_p2.user_id;
    end if;
  end if;

  if v_winner is null then
    update public.rank_matches
       set status = 'cancelled', finished_at = v_now, settled_at = v_now
     where id = p_match_id;
    update public.rank_match_players
       set result = 'draw',
           xp_before = coalesce((select xp from public.learner_progress where user_id = rank_match_players.user_id), 0),
           xp_change = 0,
           xp_after = coalesce((select xp from public.learner_progress where user_id = rank_match_players.user_id), 0)
     where match_id = p_match_id;
    insert into public.rank_history(match_id,user_id,lesson_id,result,xp_before,xp_change,xp_after,opponent_id)
    values
      (p_match_id,v_p1.user_id,v_match.lesson_id,'draw',coalesce((select xp from public.learner_progress where user_id=v_p1.user_id),0),0,coalesce((select xp from public.learner_progress where user_id=v_p1.user_id),0),v_p2.user_id),
      (p_match_id,v_p2.user_id,v_match.lesson_id,'draw',coalesce((select xp from public.learner_progress where user_id=v_p2.user_id),0),0,coalesce((select xp from public.learner_progress where user_id=v_p2.user_id),0),v_p1.user_id)
    on conflict (match_id,user_id) do nothing;
    return jsonb_build_object('status', 'cancelled', 'result', 'draw');
  end if;

  v_loser := case when v_winner = v_p1.user_id then v_p2.user_id else v_p1.user_id end;
  v_winner_change := round(v_match.lesson_xp * 1.5)::integer;

  insert into public.learner_progress(user_id,xp,completed,streak,last_day,updated_at)
  values (v_winner, v_winner_change, '{}', 0, null, v_now)
  on conflict (user_id) do update
    set xp = public.learner_progress.xp + v_winner_change, updated_at = v_now;
  insert into public.learner_progress(user_id,xp,completed,streak,last_day,updated_at)
  values (v_loser, 0, '{}', 0, null, v_now)
  on conflict (user_id) do nothing;

  select xp into v_winner_before from public.learner_progress where user_id = v_winner;
  v_winner_before := v_winner_before - v_winner_change;
  select xp into v_loser_before from public.learner_progress where user_id = v_loser;
  update public.learner_progress
     set xp = greatest(0, xp - v_match.lesson_xp), updated_at = v_now
   where user_id = v_loser;

  update public.rank_matches
     set status = 'forfeit', winner_id = v_winner, finished_at = v_now, settled_at = v_now
   where id = p_match_id;
  update public.rank_match_players
     set result = case when user_id = v_winner then 'winner' else 'forfeit' end,
         xp_before = case when user_id = v_winner then v_winner_before else v_loser_before end,
         xp_change = case when user_id = v_winner then v_winner_change else -least(v_loser_before, v_match.lesson_xp) end,
         xp_after = case when user_id = v_winner then v_winner_before + v_winner_change else greatest(0, v_loser_before - v_match.lesson_xp) end
   where match_id = p_match_id;
  insert into public.rank_history(match_id,user_id,lesson_id,result,xp_before,xp_change,xp_after,opponent_id)
  select p_match_id, p.user_id, v_match.lesson_id,
         case when p.user_id = v_winner then 'winner' else 'forfeit' end,
         p.xp_before, p.xp_change, p.xp_after,
         case when p.user_id = v_winner then v_loser else v_winner end
    from public.rank_match_players p where p.match_id = p_match_id
  on conflict (match_id,user_id) do nothing;

  return jsonb_build_object('status', 'forfeit', 'winner_id', v_winner);
end;
$$;

revoke all on function public.expire_rank_match(uuid) from public, anon, authenticated;
grant execute on function public.expire_rank_match(uuid) to service_role;

commit;
