-- Phase 6 — Optional parent "quality rating" on a completed chore.
--
-- Parents may rate the quality of a verified completion with a smiley
-- (4 = 🤩 excellent, 3 = 🙂 good, 2 = 😐 okay, 1 = 😞 needs work). Unrated
-- (null) keeps full points. Lower ratings scale points down proportionally
-- via the shared helper in lib/quality-rating.ts; the API writes the result
-- into chore_completions.points_earned so every downstream aggregation
-- (balance, insights, levels) reflects it automatically.
--
-- Idempotent.

alter table public.chore_completions
  add column if not exists quality_rating smallint;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'chore_completions_quality_rating_check') then
    alter table public.chore_completions drop constraint chore_completions_quality_rating_check;
  end if;
end $$;

alter table public.chore_completions
  add constraint chore_completions_quality_rating_check
  check (quality_rating is null or quality_rating between 1 and 4);
