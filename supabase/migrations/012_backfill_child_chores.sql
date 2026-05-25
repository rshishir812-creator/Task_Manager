-- Phase — Back-assign existing family chores to children
--
-- Problem this fixes:
--   Auto-assignment only happens at chore-creation time, for children who
--   exist at that moment. A child who joins the family AFTER chores were
--   created never gets assigned to them, so their dashboard shows no chores.
--
-- What this does:
--   1. One-time backfill: assign every ACTIVE family chore to every existing
--      child in that family. New rows get created_at = now() (column default),
--      so chores appear from today forward — past "missed" days are NOT created.
--   2. Updates handle_new_user so future children inherit all active family
--      chores on join (gated to role = 'child'; co-parents unaffected).
--
-- Idempotent — on conflict do nothing protects existing/soft-removed rows.

-- ============================================================
-- 1. One-time backfill for existing children
-- ============================================================
insert into public.chore_assignments (chore_id, user_id)
select c.id, p.id
  from public.chores c
  join public.profiles p
    on p.family_id = c.family_id
   and p.role = 'child'
 where c.is_active = true
on conflict do nothing;

-- ============================================================
-- 2. Updated handle_new_user — children inherit active family chores on join
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

    -- Children inherit all existing active family chores on join
    if coalesce(invite_role, 'child') = 'child' then
      insert into public.chore_assignments (chore_id, user_id)
      select c.id, new.id
        from public.chores c
       where c.family_id = invite_family
         and c.is_active = true
      on conflict do nothing;
    end if;

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
-- 3. Sanity notice
-- ============================================================
do $$
declare
  a_count int;
begin
  select count(*) into a_count from public.chore_assignments;
  raise notice 'Back-assignment migration complete. Total assignments: %', a_count;
end $$;
