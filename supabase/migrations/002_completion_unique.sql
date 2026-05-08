-- Unique constraint so upsert on (chore_id, user_id, completed_date) works
alter table public.chore_completions
  add constraint chore_completions_chore_user_date_key
  unique (chore_id, user_id, completed_date);

-- Unique constraint for streaks upsert: (user_id, chore_id) including nulls
-- PostgreSQL unique constraints treat NULL as distinct, so we need a partial index
-- for the overall streak row (chore_id IS NULL).
create unique index if not exists streaks_user_overall_unique
  on public.streaks (user_id)
  where chore_id is null;

create unique index if not exists streaks_user_chore_unique
  on public.streaks (user_id, chore_id)
  where chore_id is not null;
