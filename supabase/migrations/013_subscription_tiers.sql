-- Phase — Free vs Premium subscription tiers
--
-- What this does:
--   1. Adds subscription columns to `families` (family-level plan, shared by all members).
--   2. One-time grace: gives every EXISTING family a fresh 7-day trial at launch,
--      so current users (already using rewards/insights/multiple kids) keep full
--      access for a week before Free limits apply.
--   3. Hardens `families` so a parent can't grant themselves Premium by editing
--      their own row — tier/trial columns become service-role-only.
--
-- New families created after this migration inherit `subscription_tier = 'free'`
-- and NULL trial columns automatically via the column defaults — handle_new_user
-- inserts only `(name)`, so no trigger change is needed. New parents opt into the
-- trial later via the in-app "Start free trial" button.
--
-- Idempotent.

-- ============================================================
-- 1. Subscription columns on families
-- ============================================================
alter table public.families
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists trial_started_at  timestamptz,
  add column if not exists trial_ends_at     timestamptz,
  add column if not exists premium_since     timestamptz;

-- Constrain tier values (drop + re-add so it's idempotent)
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'families_subscription_tier_check') then
    alter table public.families drop constraint families_subscription_tier_check;
  end if;
end $$;

alter table public.families
  add constraint families_subscription_tier_check
  check (subscription_tier in ('free', 'premium'));

-- ============================================================
-- 2. One-time grace trial for existing families
-- ============================================================
update public.families
   set trial_started_at = now(),
       trial_ends_at    = now() + interval '7 days'
 where trial_started_at is null;

-- ============================================================
-- 3. Harden against client-side tampering
-- RLS families_update lets a parent update their own family row. Without this,
-- a savvy parent could set subscription_tier = 'premium' directly. Restrict the
-- authenticated role to updating only `name`; tier/trial columns are then
-- writable only by the service-role admin client used in our API routes.
-- ============================================================
revoke update on public.families from authenticated;
grant  update (name) on public.families to authenticated;

-- ============================================================
-- 4. Sanity notice
-- ============================================================
do $$
declare
  trialing int;
begin
  select count(*) into trialing from public.families where trial_ends_at > now();
  raise notice 'Subscription tiers migration complete. Families currently in trial: %', trialing;
end $$;
