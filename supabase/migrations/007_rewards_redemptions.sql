-- Phase 4 — Rewards & redemptions
--
-- Adds three tables:
--   rewards            — parent-defined catalog (icon, title, points_cost)
--   reward_assignments — which kids can see/redeem each reward (mirrors chore_assignments)
--   redemptions        — ledger: child taps "redeem" → pending → parent approves/denies
--
-- Available balance computation:
--   earned    = sum(chore_completions.points_earned) + sum(daily_bonuses.points_bonus)
--   spent     = sum(redemptions.points_cost where status = 'approved')
--   available = earned - spent
--
-- Idempotent.

-- ============================================================
-- 1. rewards
-- ============================================================
create table if not exists public.rewards (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.families(id) on delete cascade,
  title          text not null,
  description    text,
  icon           text default '🎁',
  points_cost    integer not null check (points_cost > 0),
  is_active      boolean not null default true,
  deactivated_at timestamptz,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  sort_order     integer not null default 0
);

create index if not exists idx_rewards_family on public.rewards (family_id);

-- Keep deactivated_at in sync with is_active toggles (mirrors chores pattern)
create or replace function public.sync_reward_deactivated_at()
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

drop trigger if exists rewards_sync_deactivated on public.rewards;
create trigger rewards_sync_deactivated
  before update on public.rewards
  for each row
  when (old.is_active is distinct from new.is_active)
  execute function public.sync_reward_deactivated_at();

-- ============================================================
-- 2. reward_assignments
-- ============================================================
create table if not exists public.reward_assignments (
  reward_id  uuid not null references public.rewards(id)   on delete cascade,
  user_id    uuid not null references public.profiles(id)  on delete cascade,
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (reward_id, user_id)
);

create index if not exists idx_reward_assignments_user on public.reward_assignments (user_id);

-- ============================================================
-- 3. redemptions  — ledger of "child requested this reward"
-- ============================================================
create table if not exists public.redemptions (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.families(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  reward_id      uuid references public.rewards(id) on delete set null,
  -- Snapshot fields so deleted rewards still display correctly in history
  reward_title   text not null,
  reward_icon    text,
  points_cost    integer not null check (points_cost > 0),
  status         text not null check (status in ('pending', 'approved', 'denied')) default 'pending',
  requested_at   timestamptz not null default now(),
  decided_at     timestamptz,
  decided_by     uuid references public.profiles(id) on delete set null,
  decided_note   text
);

create index if not exists idx_redemptions_user           on public.redemptions (user_id, status);
create index if not exists idx_redemptions_family_pending on public.redemptions (family_id) where status = 'pending';

-- ============================================================
-- 4. RLS
-- ============================================================
alter table public.rewards             enable row level security;
alter table public.reward_assignments  enable row level security;
alter table public.redemptions         enable row level security;

-- rewards: family-scoped read; parent-scoped write
drop policy if exists "rewards_select" on public.rewards;
drop policy if exists "rewards_insert" on public.rewards;
drop policy if exists "rewards_update" on public.rewards;
drop policy if exists "rewards_delete" on public.rewards;

create policy "rewards_select" on public.rewards
  for select using (
    family_id = public.my_family_id()
    or public.is_super_admin()
  );

create policy "rewards_insert" on public.rewards
  for insert with check (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

create policy "rewards_update" on public.rewards
  for update using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

create policy "rewards_delete" on public.rewards
  for delete using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

-- reward_assignments: child can see own; parent of user can manage
drop policy if exists "reward_assignments_select" on public.reward_assignments;
drop policy if exists "reward_assignments_insert" on public.reward_assignments;
drop policy if exists "reward_assignments_delete" on public.reward_assignments;
drop policy if exists "reward_assignments_update" on public.reward_assignments;

create policy "reward_assignments_select" on public.reward_assignments
  for select using (
    auth.uid() = user_id
    or public.is_parent_of(user_id)
    or public.is_super_admin()
  );

create policy "reward_assignments_insert" on public.reward_assignments
  for insert with check (
    public.is_parent_of(user_id)
    or public.is_super_admin()
  );

create policy "reward_assignments_update" on public.reward_assignments
  for update using (
    public.is_parent_of(user_id)
    or public.is_super_admin()
  );

create policy "reward_assignments_delete" on public.reward_assignments
  for delete using (
    public.is_parent_of(user_id)
    or public.is_super_admin()
  );

-- redemptions: own read, child can request (insert as self with pending), parent can approve/deny
drop policy if exists "redemptions_select" on public.redemptions;
drop policy if exists "redemptions_insert" on public.redemptions;
drop policy if exists "redemptions_update" on public.redemptions;
drop policy if exists "redemptions_delete" on public.redemptions;

create policy "redemptions_select" on public.redemptions
  for select using (
    auth.uid() = user_id
    or public.is_parent_of(user_id)
    or public.is_super_admin()
  );

-- Child can request for themselves; parent can request on behalf of their kid (super too).
create policy "redemptions_insert" on public.redemptions
  for insert with check (
    auth.uid() = user_id
    or public.is_parent_of(user_id)
    or public.is_super_admin()
  );

-- Only parents/super can change status (approve/deny).
create policy "redemptions_update" on public.redemptions
  for update using (
    public.is_parent_of(user_id)
    or public.is_super_admin()
  );

-- Child can withdraw own pending request; parent/super can delete anything.
create policy "redemptions_delete" on public.redemptions
  for delete using (
    (auth.uid() = user_id and status = 'pending')
    or public.is_parent_of(user_id)
    or public.is_super_admin()
  );

-- ============================================================
-- 5. Sanity notice
-- ============================================================
do $$
declare r_count int; ra_count int; rd_count int;
begin
  select count(*) into r_count  from public.rewards;
  select count(*) into ra_count from public.reward_assignments;
  select count(*) into rd_count from public.redemptions;
  raise notice 'Phase 4 migration complete. Rewards: %, Assignments: %, Redemptions: %.',
    r_count, ra_count, rd_count;
end $$;
