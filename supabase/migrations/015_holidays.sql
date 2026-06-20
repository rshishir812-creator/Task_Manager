-- Phase 8 — Holiday / exemption periods (illness · travel)
--
-- 100% ADDITIVE. One new table; no changes to chores, completions, streaks,
-- badges, or XP. Holidays are exemption windows per child: dates inside a
-- holiday behave like non-scheduled days (computed at read time), so streaks,
-- badges, daily bonus, quests, and consistency are unaffected. Idempotent.

create table if not exists public.holidays (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  reason      text not null default 'other' check (reason in ('illness', 'travel', 'other')),
  note        text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  check (start_date <= end_date)
);

create index if not exists idx_holidays_user   on public.holidays (user_id);
create index if not exists idx_holidays_family on public.holidays (family_id);

-- ============================================================
-- RLS (mirrors rewards: family read, parent/super write)
-- ============================================================
alter table public.holidays enable row level security;

drop policy if exists "holidays_select" on public.holidays;
drop policy if exists "holidays_insert" on public.holidays;
drop policy if exists "holidays_update" on public.holidays;
drop policy if exists "holidays_delete" on public.holidays;

create policy "holidays_select" on public.holidays
  for select using (
    family_id = public.my_family_id()
    or public.is_super_admin()
  );

create policy "holidays_insert" on public.holidays
  for insert with check (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

create policy "holidays_update" on public.holidays
  for update using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

create policy "holidays_delete" on public.holidays
  for delete using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

do $$
declare h_count int;
begin
  select count(*) into h_count from public.holidays;
  raise notice 'Phase 8 migration complete. Holidays: %.', h_count;
end $$;
