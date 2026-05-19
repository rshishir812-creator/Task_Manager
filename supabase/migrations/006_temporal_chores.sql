-- Phase 3 — Temporal isolation of chore changes
--
-- Makes past streaks immutable:
--   1. Adds created_at + removed_at to chore_assignments so we know when each
--      assignment was active.
--   2. Adds deactivated_at to chores so soft-deletes preserve history.
--   3. Trigger keeps deactivated_at in sync with is_active toggles.
--   4. Backfills: existing assignments inherit the chore's created_at (treated
--      as "always existed since the chore did"), so Ridham's pre-existing
--      streaks are byte-identical to today.
--
-- After this migration the streak-calculator can be taught to skip chores
-- for dates before they existed / were assigned, which fixes the "adding a
-- new chore retroactively breaks streaks" bug.
--
-- Idempotent.

-- ============================================================
-- 1. Temporal columns
-- ============================================================
alter table public.chores
  add column if not exists deactivated_at timestamptz;

alter table public.chore_assignments
  add column if not exists created_at timestamptz not null default now();

alter table public.chore_assignments
  add column if not exists removed_at timestamptz;

-- ============================================================
-- 2. Backfill: existing assignments inherit chore.created_at
--    (so Ridham's pre-existing chores look "always assigned" — past dates
--     unchanged. Only chores added AFTER their assignment was inserted will
--     have a real "fresh" assignment timestamp.)
-- ============================================================
update public.chore_assignments ca
   set created_at = c.created_at
  from public.chores c
 where ca.chore_id = c.id
   and ca.created_at > c.created_at;

-- For chores already deactivated (is_active = false), seed deactivated_at
-- so future streak walks skip them from this point forward.
update public.chores
   set deactivated_at = now()
 where is_active = false and deactivated_at is null;

-- ============================================================
-- 3. Trigger: keep deactivated_at in sync with is_active toggles
-- ============================================================
create or replace function public.sync_chore_deactivated_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_active = false and old.is_active = true then
    new.deactivated_at := now();
  elsif new.is_active = true and old.is_active = false then
    new.deactivated_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists chores_sync_deactivated on public.chores;
create trigger chores_sync_deactivated
  before update on public.chores
  for each row
  when (old.is_active is distinct from new.is_active)
  execute function public.sync_chore_deactivated_at();

-- ============================================================
-- 4. Sanity notice
-- ============================================================
do $$
declare
  a_count int; a_with_created int; c_deact int;
begin
  select count(*) into a_count from public.chore_assignments;
  select count(*) into a_with_created from public.chore_assignments where created_at is not null;
  select count(*) into c_deact from public.chores where deactivated_at is not null;
  raise notice 'Phase 3 migration complete. Assignments: % (% have created_at). Chores deactivated: %.',
    a_count, a_with_created, c_deact;
end $$;
