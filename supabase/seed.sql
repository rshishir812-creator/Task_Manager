-- ChoreQuest Seed Data
-- Apply via: Supabase Studio → SQL Editor → paste → Run
-- Safe to re-run: uses ON CONFLICT DO NOTHING

-- ============================================================
-- DEFAULT CHORES (9)
-- ============================================================

insert into public.chores (title, description, icon, points, recurrence, sort_order, is_active)
values
  ('Drink Warm Water on Waking Up', null, '💧', 10, array['mon','tue','wed','thu','fri','sat','sun'], 1, true),
  ('Pranayama',                     null, '🧘', 20, array['mon','tue','wed','thu','fri','sat'],      2, true),
  ('Kharaj Practice (Singing)',     null, '🎵', 25, array['mon','tue','wed','thu','fri','sat'],      3, true),
  ('Evening Pooja',                 null, '🪔', 15, array['mon','tue','wed','thu','fri','sat','sun'], 4, true),
  ('Singing — Ragas, Song Practice & Exercises (45 min min)', null, '🎤', 30, array['mon','tue','wed','thu','fri','sat'], 5, true),
  ('Arrange Vessels',               null, '🫩', 10, array['mon','tue','wed','thu','fri','sat','sun'], 6, true),
  ('Read a Few Pages of a Book',    null, '📚', 15, array['mon','tue','wed','thu','fri','sat','sun'], 7, true),
  ('Sleep Early (before 12:00 AM)', null, '🌙', 20, array['mon','tue','wed','thu','fri','sat','sun'], 8, true),
  ('Wake Up Early (before 9:00 AM)',null, '☀️', 20, array['mon','tue','wed','thu','fri','sat','sun'], 9, true)
on conflict (title) do nothing;

-- ============================================================
-- OVERALL DAILY STREAK BADGES (8)
-- ============================================================

insert into public.badges (code, title, description, icon, badge_type, threshold, chore_id)
values
  ('overall_streak_3',   'Rookie Warrior',    '3-day overall completion streak',   '⚔️', 'streak',  3,   null),
  ('overall_streak_7',   'Week Champion',     '7-day overall completion streak',   '🏆', 'streak',  7,   null),
  ('overall_streak_10',  'Discipline Seeker', '10-day overall completion streak',  '🎯', 'streak',  10,  null),
  ('overall_streak_15',  'Habit Hero',        '15-day overall completion streak',  '🦸', 'streak',  15,  null),
  ('overall_streak_21',  '21-Day Legend',     '21-day overall completion streak',  '🌀', 'streak',  21,  null),
  ('overall_streak_30',  'Month Master',      '30-day overall completion streak',  '💪', 'streak',  30,  null),
  ('overall_streak_50',  'Golden Streak',     '50-day overall completion streak',  '🌟', 'streak',  50,  null),
  ('overall_streak_100', 'Century Champion',  '100-day overall completion streak', '👑', 'streak',  100, null)
on conflict (code) do nothing;

-- ============================================================
-- PER-CHORE STREAK BADGES (9 chores × 7 thresholds = 63)
-- ============================================================

do $$
declare
  c          record;
  thresholds int[]  := array[3, 7, 10, 15, 30, 50, 100];
  icons      text[] := array['🥉','🥈','🥇','🔥','💎','👑','🌟'];
  i          int;
  slug       text;
begin
  for c in select id, title from public.chores loop
    slug := regexp_replace(lower(c.title), '[^a-z0-9]+', '_', 'g');
    for i in 1..array_length(thresholds, 1) loop
      insert into public.badges (code, title, description, icon, badge_type, threshold, chore_id)
      values (
        'chore_streak_' || thresholds[i] || '_' || slug,
        thresholds[i] || '-day streak — ' || c.title,
        thresholds[i] || ' days in a row',
        icons[i],
        'streak',
        thresholds[i],
        c.id
      )
      on conflict (code) do nothing;
    end loop;
  end loop;
end $$;

-- ============================================================
-- SPECIAL BADGES (6)
-- ============================================================

insert into public.badges (code, title, description, icon, badge_type, threshold, chore_id)
values
  (
    'special_early_bird',
    'Early Bird',
    'Wake up before 9 AM for 7 days straight',
    '🐦', 'special', 7,
    (select id from public.chores where title = 'Wake Up Early (before 9:00 AM)')
  ),
  (
    'special_bookworm',
    'Bookworm',
    'Read every day for 30 days',
    '📖', 'special', 30,
    (select id from public.chores where title = 'Read a Few Pages of a Book')
  ),
  (
    'special_singing_star',
    'Singing Star',
    'Complete all singing tasks for 14 days',
    '⭐', 'special', 14,
    null
  ),
  (
    'special_perfect_week',
    'Perfect Week',
    '100% of tasks for 7 days straight',
    '🌈', 'special', 7,
    null
  ),
  (
    'special_pooja_devotee',
    'Pooja Devotee',
    'Evening Pooja for 30 days straight',
    '🪔', 'special', 30,
    (select id from public.chores where title = 'Evening Pooja')
  ),
  (
    'special_pill_paladin',
    'Pill Paladin',
    'Your shield against skipping — 50 nights straight',
    '🛡️', 'special', 50,
    (select id from public.chores where lower(title) like '%medicine%' limit 1)
  )
on conflict (code) do nothing;

-- ============================================================
-- AWARD BADGES (cumulative completion counts — milestone type)
-- ============================================================

insert into public.badges (code, title, description, icon, badge_type, threshold, chore_id)
values
  (
    'award_wellness_warrior',
    'Wellness Warrior',
    'Take medicines at night 100 times — gaps welcome',
    '💪', 'milestone', 100,
    (select id from public.chores where lower(title) like '%medicine%' limit 1)
  )
on conflict (code) do nothing;
