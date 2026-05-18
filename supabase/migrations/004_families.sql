-- Phase 1a — Multi-tenant family foundation
--
-- What this does:
--   1. Adds `families` and `child_invitations` tables.
--   2. Adds `family_id` + `is_super_admin` to `profiles`; adds `family_id` to `chores` and `badges`.
--   3. Renames role values: 'admin' -> 'parent', 'user' -> 'child'. Updates the CHECK constraint.
--   4. Creates the "Rao Family" and attributes Shishir + Amrita + Ridham + all existing chores/badges to it.
--      Sets is_super_admin = true on Shishir.
--   5. Replaces the email-allowlist trigger with open signup: new Google logins either join an invited
--      family as a child, or get a fresh family as parent.
--   6. Rewrites every RLS policy to be family-scoped (auth.uid() = id, family_id = my_family_id(),
--      is_parent_of(user_id), or is_super_admin()).
--
-- Safe to re-run: every step is idempotent (IF NOT EXISTS, ON CONFLICT, guarded backfills).

-- ============================================================
-- 1. NEW TABLES
-- ============================================================

create table if not exists public.families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.child_invitations (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  email       text not null,
  invited_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists idx_child_invitations_email_pending
  on public.child_invitations (lower(email))
  where accepted_at is null;

-- ============================================================
-- 2. ADD COLUMNS (nullable initially so backfill can run)
-- ============================================================

alter table public.profiles add column if not exists family_id      uuid references public.families(id) on delete cascade;
alter table public.profiles add column if not exists is_super_admin boolean not null default false;
alter table public.chores   add column if not exists family_id      uuid references public.families(id) on delete cascade;
alter table public.badges   add column if not exists family_id      uuid references public.families(id) on delete cascade;

-- ============================================================
-- 3. ROLE RENAME: admin -> parent, user -> child
-- profiles.role is a text + CHECK column, not an enum.
-- ============================================================

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'parent' where role = 'admin';
update public.profiles set role = 'child'  where role = 'user';
alter table public.profiles alter column role set default 'parent';
alter table public.profiles add constraint profiles_role_check check (role in ('parent', 'child'));

-- ============================================================
-- 4. BACKFILL: Rao Family + attribution
-- ============================================================

do $$
declare rao_id uuid;
begin
  select id into rao_id from public.families where name = 'Rao Family' limit 1;
  if rao_id is null then
    insert into public.families (name) values ('Rao Family') returning id into rao_id;
  end if;

  update public.profiles set family_id = rao_id where family_id is null;
  update public.profiles set is_super_admin = true where email = 'r.shishir812@gmail.com' and is_super_admin = false;
  update public.chores set family_id = rao_id where family_id is null;
  update public.badges set family_id = rao_id where family_id is null;
end $$;

-- ============================================================
-- 5. LOCK DOWN: family_id NOT NULL going forward
-- ============================================================

alter table public.profiles alter column family_id set not null;
alter table public.chores   alter column family_id set not null;
alter table public.badges   alter column family_id set not null;

-- ============================================================
-- 5b. UNIQUE CONSTRAINTS — make codes/titles unique per-family, not globally
-- ============================================================
-- Two different families can both have a "Drink Water" chore + standard streak
-- ladder. Without this, the auto-generator in /api/admin/chores collides on the
-- second family's first chore that happens to share a slug with Rao's existing
-- badges (e.g. chore_streak_3_drink_water).

-- badges.code: drop global unique, add composite (code, family_id)
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'badges_code_key'
  ) then
    alter table public.badges drop constraint badges_code_key;
  end if;
end $$;

create unique index if not exists badges_code_family_unique on public.badges (code, family_id);

-- chores.title: same idea — title can be the same across families
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'chores_title_key'
  ) then
    alter table public.chores drop constraint chores_title_key;
  end if;
end $$;

create unique index if not exists chores_title_family_unique on public.chores (title, family_id);

-- ============================================================
-- 6. HELPER FUNCTIONS (replace old is_admin)
-- ============================================================

drop function if exists public.is_admin(uuid);

create or replace function public.my_family_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_super_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_parent() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'parent'
  );
$$;

create or replace function public.is_parent_of(target uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.profiles me, public.profiles them
     where me.id = auth.uid()
       and me.role = 'parent'
       and them.id = target
       and them.family_id = me.family_id
  );
$$;

-- ============================================================
-- 7. REPLACE handle_new_user TRIGGER (open signup + invite flow)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_family uuid;
  new_family    uuid;
  display_name  text;
begin
  -- Idempotent: existing profile (re-signin) is a no-op
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- Invite path: child joins an existing family
  select family_id into invite_family
    from public.child_invitations
   where lower(email) = lower(new.email)
     and accepted_at is null
   order by created_at desc
   limit 1;

  if invite_family is not null then
    insert into public.profiles (id, email, name, avatar_url, role, family_id)
      values (
        new.id,
        new.email,
        display_name,
        new.raw_user_meta_data->>'avatar_url',
        'child',
        invite_family
      );
    update public.child_invitations
       set accepted_at = now()
     where lower(email) = lower(new.email)
       and accepted_at is null;
    return new;
  end if;

  -- New parent path: fresh family
  insert into public.families (name)
    values (display_name || '''s Family')
    returning id into new_family;

  insert into public.profiles (id, email, name, avatar_url, role, family_id)
    values (
      new.id,
      new.email,
      display_name,
      new.raw_user_meta_data->>'avatar_url',
      'parent',
      new_family
    );

  return new;
end;
$$;

-- ============================================================
-- 8. RLS POLICIES — family-scoped rewrite
-- ============================================================

-- ---------- profiles ----------
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete" on public.profiles;

create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or family_id = public.my_family_id()
    or public.is_super_admin()
  );

create policy "profiles_update" on public.profiles
  for update using (
    auth.uid() = id
    or public.is_super_admin()
  );

create policy "profiles_delete" on public.profiles
  for delete using (public.is_super_admin());

-- ---------- chores ----------
drop policy if exists "chores_select" on public.chores;
drop policy if exists "chores_insert" on public.chores;
drop policy if exists "chores_update" on public.chores;
drop policy if exists "chores_delete" on public.chores;

create policy "chores_select" on public.chores
  for select using (
    family_id = public.my_family_id()
    or public.is_super_admin()
  );

create policy "chores_insert" on public.chores
  for insert with check (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

create policy "chores_update" on public.chores
  for update using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

create policy "chores_delete" on public.chores
  for delete using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

-- ---------- badges ----------
drop policy if exists "badges_select" on public.badges;
drop policy if exists "badges_insert" on public.badges;
drop policy if exists "badges_update" on public.badges;
drop policy if exists "badges_delete" on public.badges;

create policy "badges_select" on public.badges
  for select using (
    family_id = public.my_family_id()
    or public.is_super_admin()
  );

create policy "badges_insert" on public.badges
  for insert with check (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

create policy "badges_update" on public.badges
  for update using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

create policy "badges_delete" on public.badges
  for delete using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

-- ---------- chore_completions ----------
drop policy if exists "completions_select" on public.chore_completions;
drop policy if exists "completions_insert" on public.chore_completions;
drop policy if exists "completions_update" on public.chore_completions;
drop policy if exists "completions_delete" on public.chore_completions;

create policy "completions_select" on public.chore_completions
  for select using (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "completions_insert" on public.chore_completions
  for insert with check (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "completions_update" on public.chore_completions
  for update using (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "completions_delete" on public.chore_completions
  for delete using (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());

-- ---------- daily_bonuses ----------
drop policy if exists "bonuses_select" on public.daily_bonuses;
drop policy if exists "bonuses_insert" on public.daily_bonuses;
drop policy if exists "bonuses_update" on public.daily_bonuses;
drop policy if exists "bonuses_delete" on public.daily_bonuses;

create policy "bonuses_select" on public.daily_bonuses
  for select using (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "bonuses_insert" on public.daily_bonuses
  for insert with check (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "bonuses_update" on public.daily_bonuses
  for update using (public.is_parent_of(user_id) or public.is_super_admin());
create policy "bonuses_delete" on public.daily_bonuses
  for delete using (public.is_parent_of(user_id) or public.is_super_admin());

-- ---------- streaks ----------
drop policy if exists "streaks_select" on public.streaks;
drop policy if exists "streaks_insert" on public.streaks;
drop policy if exists "streaks_update" on public.streaks;
drop policy if exists "streaks_delete" on public.streaks;

create policy "streaks_select" on public.streaks
  for select using (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "streaks_insert" on public.streaks
  for insert with check (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "streaks_update" on public.streaks
  for update using (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "streaks_delete" on public.streaks
  for delete using (public.is_parent_of(user_id) or public.is_super_admin());

-- ---------- user_badges ----------
drop policy if exists "user_badges_select" on public.user_badges;
drop policy if exists "user_badges_insert" on public.user_badges;
drop policy if exists "user_badges_update" on public.user_badges;
drop policy if exists "user_badges_delete" on public.user_badges;

create policy "user_badges_select" on public.user_badges
  for select using (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "user_badges_insert" on public.user_badges
  for insert with check (auth.uid() = user_id or public.is_parent_of(user_id) or public.is_super_admin());
create policy "user_badges_update" on public.user_badges
  for update using (public.is_parent_of(user_id) or public.is_super_admin());
create policy "user_badges_delete" on public.user_badges
  for delete using (public.is_parent_of(user_id) or public.is_super_admin());

-- ============================================================
-- 9. RLS ON NEW TABLES
-- ============================================================

alter table public.families          enable row level security;
alter table public.child_invitations enable row level security;

drop policy if exists "families_select" on public.families;
drop policy if exists "families_update" on public.families;
drop policy if exists "families_insert" on public.families;
drop policy if exists "families_delete" on public.families;

create policy "families_select" on public.families
  for select using (id = public.my_family_id() or public.is_super_admin());
create policy "families_update" on public.families
  for update using (
    (id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );
create policy "families_insert" on public.families
  for insert with check (public.is_super_admin());
create policy "families_delete" on public.families
  for delete using (public.is_super_admin());

drop policy if exists "invitations_select" on public.child_invitations;
drop policy if exists "invitations_insert" on public.child_invitations;
drop policy if exists "invitations_delete" on public.child_invitations;

create policy "invitations_select" on public.child_invitations
  for select using (family_id = public.my_family_id() or public.is_super_admin());
create policy "invitations_insert" on public.child_invitations
  for insert with check (
    family_id = public.my_family_id() and public.is_parent()
  );
create policy "invitations_delete" on public.child_invitations
  for delete using (
    (family_id = public.my_family_id() and public.is_parent())
    or public.is_super_admin()
  );

-- ============================================================
-- 10. NOTICE
-- ============================================================

do $$
declare
  fam_count int; prof_count int; chore_count int; badge_count int;
begin
  select count(*) into fam_count   from public.families;
  select count(*) into prof_count  from public.profiles where family_id is not null;
  select count(*) into chore_count from public.chores   where family_id is not null;
  select count(*) into badge_count from public.badges   where family_id is not null;
  raise notice 'Phase 1a migration complete. Families: %, Profiles: %, Chores: %, Badges: %',
    fam_count, prof_count, chore_count, badge_count;
end $$;
