-- Phase 5a — Trust verification (parent approval + self-report + time window)
--
-- Adds per-chore verification settings (any combination of parent_approval,
-- self_report, time_window) and per-completion verification state
-- (pending / verified / denied).
--
-- Honor system stays the default for every existing chore. Streaks, points,
-- badges, and daily bonuses only count rows with status='verified'.
--
-- Idempotent.

-- ============================================================
-- 1. Per-chore verification settings (all optional, all combinable)
-- ============================================================
alter table public.chores
  add column if not exists requires_parent_approval boolean not null default false;
alter table public.chores
  add column if not exists requires_self_report boolean not null default false;
alter table public.chores
  add column if not exists window_start_time time;
alter table public.chores
  add column if not exists window_end_time time;

-- Window sanity constraint (drop-and-recreate so it's idempotent)
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'chores_window_order_check') then
    alter table public.chores drop constraint chores_window_order_check;
  end if;
end $$;

alter table public.chores
  add constraint chores_window_order_check
  check (
    (window_start_time is null and window_end_time is null)
    or (window_start_time is not null and window_end_time is not null
        and window_end_time > window_start_time)
  );

-- ============================================================
-- 2. Per-completion verification state
-- ============================================================
alter table public.chore_completions
  add column if not exists status text not null default 'verified';
alter table public.chore_completions
  add column if not exists verified_by uuid references public.profiles(id) on delete set null;
alter table public.chore_completions
  add column if not exists verified_at timestamptz;
alter table public.chore_completions
  add column if not exists denial_reason text;
alter table public.chore_completions
  add column if not exists self_report_start_at timestamptz;
alter table public.chore_completions
  add column if not exists self_report_end_at timestamptz;
alter table public.chore_completions
  add column if not exists notes text;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'chore_completions_status_check') then
    alter table public.chore_completions drop constraint chore_completions_status_check;
  end if;
end $$;

alter table public.chore_completions
  add constraint chore_completions_status_check
  check (status in ('verified', 'pending', 'denied'));

-- Backfill: existing rows are verified (zero behavior change for legacy data)
update public.chore_completions set status = 'verified' where status is null;

-- ============================================================
-- 3. Index for the pending-verifications queue
-- ============================================================
create index if not exists idx_completions_pending
  on public.chore_completions (chore_id, completed_date)
  where status = 'pending';

-- ============================================================
-- 4. Notice
-- ============================================================
do $$
declare c_count int; pending_count int; verified_count int;
begin
  select count(*) into c_count        from public.chore_completions;
  select count(*) into pending_count  from public.chore_completions where status = 'pending';
  select count(*) into verified_count from public.chore_completions where status = 'verified';
  raise notice 'Phase 5a migration done. Completions: % (% verified, % pending).',
    c_count, verified_count, pending_count;
end $$;
