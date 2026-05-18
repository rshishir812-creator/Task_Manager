-- Phase 2 — Per-child chore assignments + co-parent invites
--
-- What this does:
--   1. Adds chore_assignments(chore_id, user_id) — each chore is now explicitly
--      assigned to one or more children. A child sees a chore iff there's an
--      assignment row for them.
--   2. Backfills assignments: every existing chore × every existing child in
--      the same family. Preserves current visibility exactly.
--   3. Adds a `role` column to child_invitations so the same invite mechanism
--      can onboard co-parents (role = 'parent') in addition to children.
--   4. Updates the handle_new_user trigger to honour that role.
--
-- Idempotent.

-- ============================================================
-- 1. chore_assignments
-- ============================================================
create table if not exists public.chore_assignments (
  chore_id uuid not null references public.chores(id)   on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (chore_id, user_id)
);

create index if not exists idx_chore_assignments_user on public.chore_assignments (user_id);

alter table public.chore_assignments enable row level security;

drop policy if exists "assignments_select" on public.chore_assignments;
drop policy if exists "assignments_insert" on public.chore_assignments;
drop policy if exists "assignments_delete" on public.chore_assignments;

create policy "assignments_select" on public.chore_assignments
  for select using (
    auth.uid() = user_id
    or public.is_parent_of(user_id)
    or public.is_super_admin()
  );

create policy "assignments_insert" on public.chore_assignments
  for insert with check (
    public.is_parent_of(user_id)
    or public.is_super_admin()
  );

create policy "assignments_delete" on public.chore_assignments
  for delete using (
    public.is_parent_of(user_id)
    or public.is_super_admin()
  );

-- ============================================================
-- 2. Backfill: existing chores assigned to every existing child in their family
-- ============================================================
insert into public.chore_assignments (chore_id, user_id)
select c.id, p.id
  from public.chores c
  join public.profiles p
    on p.family_id = c.family_id
   and p.role = 'child'
on conflict do nothing;

-- ============================================================
-- 3. Co-parent invitations
-- ============================================================
alter table public.child_invitations
  add column if not exists role text;

update public.child_invitations set role = 'child' where role is null;

alter table public.child_invitations
  alter column role set default 'child',
  alter column role set not null;

-- Drop and re-add the check constraint so it's idempotent
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'child_invitations_role_check'
  ) then
    alter table public.child_invitations drop constraint child_invitations_role_check;
  end if;
end $$;

alter table public.child_invitations
  add constraint child_invitations_role_check check (role in ('parent', 'child'));

-- ============================================================
-- 4. Updated handle_new_user trigger — honours role from the invitation
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_family uuid;
  invite_role   text;
  new_family    uuid;
  display_name  text;
begin
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- Most recent pending invite for this email
  select family_id, role
    into invite_family, invite_role
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
        coalesce(invite_role, 'child'),
        invite_family
      );
    update public.child_invitations
       set accepted_at = now()
     where lower(email) = lower(new.email)
       and accepted_at is null;
    return new;
  end if;

  -- No invite → new parent, fresh family
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
-- 5. Sanity notice
-- ============================================================
do $$
declare
  c_count int; a_count int;
begin
  select count(*) into c_count from public.chores;
  select count(*) into a_count from public.chore_assignments;
  raise notice 'Phase 2 migration complete. Chores: %, Assignments: %', c_count, a_count;
end $$;
