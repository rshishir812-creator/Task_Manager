-- Phase 7 — Weekly Quests + new badges + "What's New" announcement
--
-- 100% ADDITIVE. Creates two new tables (challenges, challenge_claims), adds a
-- batch of new badge rows for every existing family, and adds one nullable
-- column to profiles. No existing rows are modified; existing chores,
-- completions, streaks, badges, and XP are untouched. Idempotent / re-runnable.

-- ============================================================
-- 1. challenges — auto-rotating weekly quest definitions (family-scoped)
-- ============================================================
create table if not exists public.challenges (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families(id) on delete cascade,
  code          text not null,
  title         text not null,
  description   text,
  icon          text default '🎯',
  goal_type     text not null check (goal_type in (
                   'chores_completed', 'perfect_days', 'high_quality', 'early_bird'
                 )),
  goal_target   integer not null check (goal_target > 0),
  reward_points integer not null default 150 check (reward_points >= 0),
  period_start  date not null,
  period_end    date not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (family_id, code, period_start)
);

create index if not exists idx_challenges_family_period
  on public.challenges (family_id, period_start);

-- ============================================================
-- 2. challenge_claims — per-user quest completion (snapshots the reward)
-- ============================================================
create table if not exists public.challenge_claims (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  challenge_id  uuid not null references public.challenges(id) on delete cascade,
  progress_count integer not null default 0,
  reward_points integer not null default 0,
  claimed_at    timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index if not exists idx_challenge_claims_user on public.challenge_claims (user_id);

-- ============================================================
-- 3. RLS (mirrors rewards/redemptions; writes happen via service role)
-- ============================================================
alter table public.challenges       enable row level security;
alter table public.challenge_claims enable row level security;

drop policy if exists "challenges_select" on public.challenges;
drop policy if exists "challenges_write"  on public.challenges;

create policy "challenges_select" on public.challenges
  for select using (
    family_id = public.my_family_id()
    or public.is_super_admin()
  );

-- Parents/super may manage; the engine inserts via service role regardless.
create policy "challenges_write" on public.challenges
  for all using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  ) with check (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

drop policy if exists "challenge_claims_select" on public.challenge_claims;
drop policy if exists "challenge_claims_write"  on public.challenge_claims;

create policy "challenge_claims_select" on public.challenge_claims
  for select using (
    auth.uid() = user_id
    or public.is_parent_of(user_id)
    or public.is_super_admin()
  );

create policy "challenge_claims_write" on public.challenge_claims
  for all using (
    auth.uid() = user_id
    or public.is_parent_of(user_id)
    or public.is_super_admin()
  ) with check (
    auth.uid() = user_id
    or public.is_parent_of(user_id)
    or public.is_super_admin()
  );

-- ============================================================
-- 4. "What's New" seen marker (version-aware, additive nullable column)
-- ============================================================
alter table public.profiles
  add column if not exists whats_new_seen_version text null;

-- ============================================================
-- 5. New badges — inserted for EVERY existing family.
--    total_*   : cumulative completions (any chore)  -> badge_type 'milestone', chore_id null
--    quality_* : count of 4-star (top) quality ratings -> 'special'
--    level_*   : reach a level (by total XP)            -> 'special' (threshold = level)
--    quest_*   : weekly quests completed               -> 'special'
-- ============================================================
insert into public.badges (code, title, description, icon, badge_type, threshold, chore_id, family_id)
select v.code, v.title, v.description, v.icon, v.badge_type, v.threshold, null, f.id
from public.families f
cross join (values
  ('total_50',        'Getting Started',  'Complete 50 chores in total',           '🌱', 'milestone',  50),
  ('total_100',       'Centurion',        'Complete 100 chores in total',          '💯', 'milestone', 100),
  ('total_250',       'Quarter-Master',   'Complete 250 chores in total',          '🎖️', 'milestone', 250),
  ('total_500',       'Unstoppable',      'Complete 500 chores in total',          '🚀', 'milestone', 500),
  ('total_1000',      'Quest Master',     'Complete 1000 chores in total',         '🏰', 'milestone', 1000),
  ('quality_ace_25',  'Rising Star',      'Earn 25 top-effort (4-star) ratings',   '🌟', 'special',    25),
  ('quality_ace_100', 'Perfectionist',    'Earn 100 top-effort (4-star) ratings',  '💎', 'special',   100),
  ('level_3',         'Achiever Unlocked','Reach Level 3',                         '🥉', 'special',     3),
  ('level_5',         'Hero Unlocked',    'Reach Level 5',                         '🦸', 'special',     5),
  ('level_7',         'Grand Master',     'Reach Level 7',                         '👑', 'special',     7),
  ('quest_1',         'Quest Starter',    'Complete your first Weekly Quest',      '🗺️', 'special',     1),
  ('quest_5',         'Quest Regular',    'Complete 5 Weekly Quests',              '🧭', 'special',     5),
  ('quest_15',        'Quest Legend',     'Complete 15 Weekly Quests',             '🏆', 'special',    15)
) as v(code, title, description, icon, badge_type, threshold)
on conflict (code, family_id) do nothing;

-- ============================================================
-- 6. Sanity notice
-- ============================================================
do $$
declare c_count int; b_count int;
begin
  select count(*) into c_count from public.challenges;
  select count(*) into b_count from public.badges where code like 'total_%' or code like 'quality_ace_%' or code like 'level_%' or code like 'quest_%';
  raise notice 'Phase 7 migration complete. Challenges: %, new badge rows: %.', c_count, b_count;
end $$;
