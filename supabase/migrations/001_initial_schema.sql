-- ChoreQuest Initial Schema
-- Apply via: Supabase Studio → SQL Editor → paste → Run

create extension if not exists pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.profiles (
  id           uuid references auth.users primary key,
  email        text unique not null,
  name         text,
  avatar_url   text,
  role         text check (role in ('admin', 'user')) default 'user',
  timezone     text default 'Asia/Kolkata',
  created_at   timestamptz default now()
);

create table if not exists public.chores (
  id           uuid primary key default gen_random_uuid(),
  title        text not null unique,
  description  text,
  icon         text,
  points       integer default 10,
  recurrence   text[] not null default '{}',
  is_active    boolean default true,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now(),
  sort_order   integer default 0
);

create table if not exists public.chore_completions (
  id               uuid primary key default gen_random_uuid(),
  chore_id         uuid references public.chores(id) on delete cascade,
  user_id          uuid references public.profiles(id) on delete cascade,
  completed_date   date not null,
  is_exception     boolean default false,
  exception_reason text,
  completed_at     timestamptz,
  points_earned    integer,
  unique (chore_id, user_id, completed_date)
);

create table if not exists public.daily_bonuses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  bonus_date   date not null,
  points_bonus integer default 50,
  awarded_at   timestamptz default now(),
  unique (user_id, bonus_date)
);

create table if not exists public.streaks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade,
  chore_id        uuid references public.chores(id) on delete cascade,
  current_streak  integer default 0,
  longest_streak  integer default 0,
  last_completed  date,
  updated_at      timestamptz default now()
);

create table if not exists public.badges (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  title        text not null,
  description  text,
  icon         text,
  badge_type   text check (badge_type in ('streak', 'milestone', 'special')),
  threshold    integer,
  chore_id     uuid references public.chores(id) on delete set null
);

create table if not exists public.user_badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references public.profiles(id) on delete cascade,
  badge_id  uuid references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  unique (user_id, badge_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_chore_completions_user_date
  on public.chore_completions (user_id, completed_date);

create index if not exists idx_streaks_user_chore
  on public.streaks (user_id, chore_id);

-- ============================================================
-- HELPER: is_admin() — used in RLS to avoid recursive policy lookups
-- ============================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

-- ============================================================
-- TRIGGER: auto-create profile on auth.users insert
-- Assigns role by email; rejects unknown emails
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  assigned_role text;
begin
  assigned_role := case new.email
    when 'r.shishir812@gmail.com' then 'admin'
    when 'amriitarao@gmail.com'   then 'admin'
    when 'ridhamrao@gmail.com'    then 'user'
    else null
  end;

  if assigned_role is null then
    raise exception 'Email % is not authorized for ChoreQuest', new.email;
  end if;

  insert into public.profiles (id, email, name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    assigned_role
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.chores            enable row level security;
alter table public.chore_completions enable row level security;
alter table public.daily_bonuses     enable row level security;
alter table public.streaks           enable row level security;
alter table public.badges            enable row level security;
alter table public.user_badges       enable row level security;

-- profiles
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_delete" on public.profiles
  for delete using (public.is_admin(auth.uid()));

-- chores (everyone authenticated can read; only admins write)
create policy "chores_select" on public.chores
  for select using (auth.role() = 'authenticated');

create policy "chores_insert" on public.chores
  for insert with check (public.is_admin(auth.uid()));

create policy "chores_update" on public.chores
  for update using (public.is_admin(auth.uid()));

create policy "chores_delete" on public.chores
  for delete using (public.is_admin(auth.uid()));

-- chore_completions
create policy "completions_select" on public.chore_completions
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "completions_insert" on public.chore_completions
  for insert with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "completions_update" on public.chore_completions
  for update using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "completions_delete" on public.chore_completions
  for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- daily_bonuses
create policy "bonuses_select" on public.daily_bonuses
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "bonuses_insert" on public.daily_bonuses
  for insert with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "bonuses_update" on public.daily_bonuses
  for update using (public.is_admin(auth.uid()));

create policy "bonuses_delete" on public.daily_bonuses
  for delete using (public.is_admin(auth.uid()));

-- streaks
create policy "streaks_select" on public.streaks
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "streaks_insert" on public.streaks
  for insert with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "streaks_update" on public.streaks
  for update using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "streaks_delete" on public.streaks
  for delete using (public.is_admin(auth.uid()));

-- badges (authenticated can read; only admins write)
create policy "badges_select" on public.badges
  for select using (auth.role() = 'authenticated');

create policy "badges_insert" on public.badges
  for insert with check (public.is_admin(auth.uid()));

create policy "badges_update" on public.badges
  for update using (public.is_admin(auth.uid()));

create policy "badges_delete" on public.badges
  for delete using (public.is_admin(auth.uid()));

-- user_badges
create policy "user_badges_select" on public.user_badges
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "user_badges_insert" on public.user_badges
  for insert with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "user_badges_update" on public.user_badges
  for update using (public.is_admin(auth.uid()));

create policy "user_badges_delete" on public.user_badges
  for delete using (public.is_admin(auth.uid()));
