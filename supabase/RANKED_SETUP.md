# DevLingo Ranked 1v1 Setup

## Apply database scripts in this order

1. Open Supabase Dashboard → SQL Editor.
2. Run the complete, latest `ranked_1v1.sql` file. It creates matchmaking tables and the atomic queue/cancel functions.
3. Run the complete `ranked_gameplay.sql` file. It adds answer storage, secure answer validation, completion checks, winner selection, and transactional XP settlement.
4. Confirm the project has the `rank_matches`, `rank_match_players`, `rank_queue`, `rank_history`, and `rank_match_answers` tables.

The course quiz seed scripts must already have been run so every Ranked lesson has a `Practice quiz`, questions, options, and `question_answer_keys`.

## Server environment

The following variables must exist in the Vercel environment and local `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key is server-only. Never prefix it with `NEXT_PUBLIC_` or import it into client components.

## Match rules implemented

- Two authenticated learners are paired only for the same lesson.
- A learner cannot enter another queue while they have an active match.
- Each question can be answered once per player; answer keys stay server-side.
- The pass threshold is up to 4 correct answers (4 for quizzes with 4 or more questions; all questions for shorter quizzes).
- If both players pass, the first player to finish wins. If only one passes, that player wins.
- If neither passes, the match is recorded as a draw and XP does not change.
- A match expires after 20 minutes. If one player finished and passed while the opponent did not finish, the finisher wins by forfeit; otherwise it is a no-XP draw.
- Winner receives 1.5× lesson XP (rounded to the nearest integer); loser loses lesson XP, with XP never below zero.
- XP settlement and match completion happen in one database transaction and cannot be settled twice.
- Ranked does not add the lesson to `learner_progress.completed`; ordinary lesson completion remains separate.

## Manual verification checklist

Use two separate authenticated accounts:

1. Complete the required previous lesson and ensure both accounts have at least the selected lesson XP.
2. Open the same lesson's Ranked page in both accounts.
3. Join the queue from account A, then account B. Confirm both are sent to the same match ID.
4. Answer questions from both accounts. Confirm each answer is locked after submission.
5. Finish one account first. Confirm it waits while the opponent is still playing.
6. Finish the second account. Confirm both clients show the same final winner and XP settlement.
7. Check `rank_matches`, `rank_match_players`, `rank_match_answers`, `rank_history`, and `learner_progress` in Supabase.
8. Try reloading the match page and resubmitting an answered question. The existing answer must remain recorded and must not award XP again.
9. Try opening the match URL from a third account. The API must return 403.
