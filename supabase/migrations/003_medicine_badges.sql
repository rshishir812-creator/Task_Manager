-- Re-theme the medicine chore badges:
-- 1. Drop the 7-tier auto-generated streak ladder for this chore
-- 2. Install a curated 5-tier metal ladder
-- 3. Add Pill Paladin (special, 50 nights straight)
-- 4. Add Wellness Warrior (cumulative milestone, 100 total completions)
--
-- Idempotent: safe to re-run. The DELETE steps are guarded so a second run is a no-op.
--
-- NOTE: If the medicine chore is ever deleted and re-created through the admin UI,
-- the auto-generator at app/api/admin/chores/route.ts will install a fresh 7-tier
-- streak ladder for the new chore_id. The curated 5 rows are tied to the old
-- chore_id (cascaded or orphaned by FK). To restore the level-up theme,
-- re-run this migration after the recreate.

do $$
declare med_id uuid;
begin
  select id into med_id
    from public.chores
   where lower(title) like '%medicine%'
   limit 1;

  if med_id is null then
    raise notice 'No medicine chore found — skipping medicine badge migration';
    return;
  end if;

  -- Drop any user_badges referencing the existing auto-generated streak rows for this chore
  delete from public.user_badges
   where badge_id in (
     select id from public.badges
      where chore_id = med_id
        and badge_type = 'streak'
        and code not in (
          'medicine_bronze_dose',
          'medicine_silver_schedule',
          'medicine_gold_guardian',
          'medicine_platinum_patient',
          'medicine_diamond_discipline'
        )
   );

  -- Drop the auto-generated 7-tier streak rows (anything not in the curated set)
  delete from public.badges
   where chore_id = med_id
     and badge_type = 'streak'
     and code not in (
       'medicine_bronze_dose',
       'medicine_silver_schedule',
       'medicine_gold_guardian',
       'medicine_platinum_patient',
       'medicine_diamond_discipline'
     );

  -- Install the curated 5-tier ladder
  insert into public.badges (code, title, description, icon, badge_type, threshold, chore_id) values
    ('medicine_bronze_dose',        'Bronze Dose',        'Take medicines at night 3 nights in a row',   '🥉', 'streak',     3, med_id),
    ('medicine_silver_schedule',    'Silver Schedule',    'Take medicines at night 14 nights in a row',  '🥈', 'streak',    14, med_id),
    ('medicine_gold_guardian',      'Gold Guardian',      'Take medicines at night 30 nights in a row',  '🥇', 'streak',    30, med_id),
    ('medicine_platinum_patient',   'Platinum Patient',   'Take medicines at night 90 nights in a row',  '💎', 'streak',    90, med_id),
    ('medicine_diamond_discipline', 'Diamond Discipline', 'Take medicines at night 365 nights in a row', '💠', 'streak',   365, med_id)
  on conflict (code) do nothing;

  -- Pill Paladin (special, 50 consecutive nights)
  insert into public.badges (code, title, description, icon, badge_type, threshold, chore_id) values
    ('special_pill_paladin', 'Pill Paladin',
     'Your shield against skipping — 50 nights straight', '🛡️', 'special', 50, med_id)
  on conflict (code) do nothing;

  -- Wellness Warrior (cumulative milestone, 100 total completions)
  insert into public.badges (code, title, description, icon, badge_type, threshold, chore_id) values
    ('award_wellness_warrior', 'Wellness Warrior',
     'Take medicines at night 100 times — gaps welcome', '💪', 'milestone', 100, med_id)
  on conflict (code) do nothing;
end $$;
