# 🎮 ChoreQuest — GitHub Copilot Plan Mode Prompt

> Paste everything below this line into GitHub Copilot's Plan/Chat mode.

---

## PROJECT OVERVIEW

Build **ChoreQuest** — a gamified daily chores web app for a 12-year-old boy (Ridham). The app must feel like a video game dashboard, not a chore tracker. Think XP bars, level-ups, streak flames, badge cabinets, and confetti explosions. It should be genuinely exciting to open every morning.

**Deploy target:** Vercel  
**Database/Auth backend:** Supabase  
**Auth provider:** Google OAuth (via Supabase Auth)  
**Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Framer Motion, Supabase JS client  
**Responsive:** Mobile-first, works beautifully on phone, tablet, and laptop  
**Themes:** Light mode and Dark mode (system default + manual toggle)

---

## TECH STACK & SETUP

```
Framework:     Next.js 14+ with App Router
Language:      TypeScript (strict mode)
Styling:       Tailwind CSS + custom CSS variables for theming
Animation:     Framer Motion
Database:      Supabase (PostgreSQL)
Auth:          Supabase Auth + Google OAuth provider
Deployment:    Vercel (vercel.json config included)
Icons:         Lucide React
Fonts:         Google Fonts — "Nunito" (body, friendly/rounded) + "Baloo 2" (display/headings, playful)
```

### Environment Variables needed (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

---

## AUTHENTICATION & ROLES

### Users & Roles (hardcoded in DB seed + role check):
| Email | Role |
|---|---|
| shishir.rao@gmail.com | admin |
| amriitarao@gmail.com | admin |
| ridhamrao@gmail.com | user |

### Auth Flow:
- Google OAuth only (no email/password)
- On first login, check email against `profiles` table → assign role
- If email not in allowed list → show friendly "Access Denied" page
- After login, redirect based on role:
  - `admin` → `/admin/dashboard`
  - `user` → `/dashboard`
- Session persisted via Supabase Auth cookies (SSR-compatible)
- Middleware in `middleware.ts` protects all `/admin/*` and `/dashboard` routes

---

## DATABASE SCHEMA (Supabase PostgreSQL)

Create these tables with RLS (Row Level Security) enabled:

### `profiles`
```sql
id           uuid references auth.users primary key
email        text unique not null
name         text
avatar_url   text
role         text check (role in ('admin', 'user')) default 'user'
created_at   timestamptz default now()
```

### `chores`
```sql
id              uuid primary key default gen_random_uuid()
title           text not null
description     text
icon            text              -- emoji or icon name
points          integer default 10
recurrence      text[]            -- ['mon','tue','wed','thu','fri','sat','sun'] or subset
is_active       boolean default true
created_by      uuid references profiles(id)
created_at      timestamptz default now()
sort_order      integer default 0
```

### `chore_completions`
```sql
id              uuid primary key default gen_random_uuid()
chore_id        uuid references chores(id)
user_id         uuid references profiles(id)
completed_date  date not null
is_exception    boolean default false   -- marked as exception (skipped but streak preserved)
exception_reason text
completed_at    timestamptz
points_earned   integer
```

### `daily_bonuses`
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references profiles(id)
bonus_date      date not null unique
points_bonus    integer default 50
awarded_at      timestamptz default now()
```

### `streaks`  (computed + cached)
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references profiles(id)
chore_id        uuid references chores(id)  -- null = overall daily streak
current_streak  integer default 0
longest_streak  integer default 0
last_completed  date
updated_at      timestamptz default now()
```

### `badges`
```sql
id              uuid primary key default gen_random_uuid()
code            text unique not null    -- e.g. 'streak_10_pranayama'
title           text not null
description     text
icon            text                    -- emoji
badge_type      text                    -- 'streak', 'milestone', 'special'
threshold       integer                 -- streak days or points needed
chore_id        uuid references chores(id)  -- null = overall
```

### `user_badges`
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references profiles(id)
badge_id        uuid references badges(id)
earned_at       timestamptz default now()
```

**RLS Policies:**
- Users can only read/write their own `chore_completions`, `streaks`, `user_badges`
- Admins (check via `profiles.role`) can read all rows and write to `chores`, `badges`
- Use Supabase service role key only server-side for admin writes

---

## DEFAULT CHORES (seed data)

Seed these chores on first setup:

| # | Title | Icon | Points | Days |
|---|---|---|---|---|
| 1 | Drink Warm Water on Waking Up | 💧 | 10 | All 7 days |
| 2 | Pranayama | 🧘 | 20 | Mon–Sat (exclude Sunday) |
| 3 | Kharaj Practice (Singing) | 🎵 | 25 | Mon–Sat (exclude Sunday) |
| 4 | Evening Pooja | 🪔 | 15 | All 7 days |
| 5 | Singing — Ragas, Song Practice & Exercises (45 min min) | 🎤 | 30 | Mon–Sat (exclude Sunday) |
| 6 | Arrange Vessels | 🫙 | 10 | All 7 days |
| 7 | Read a Few Pages of a Book | 📚 | 15 | All 7 days |
| 8 | Sleep Early (before 12:00 AM) | 🌙 | 20 | All 7 days |
| 9 | Wake Up Early (before 9:00 AM) | ☀️ | 20 | All 7 days |

Daily All-Complete Bonus: **+50 points**

---

## BADGE / MEDAL SYSTEM (seed data)

Create these badges. Award automatically via a Supabase Edge Function or server action triggered on completion save:

### Per-Chore Streak Badges:
For EACH chore, generate badges at: 3, 7, 10, 15, 30, 50, 100 day streaks  
Naming pattern: `"{N}-day streak — {Chore Name}"`  
Icons: 🥉(3) 🥈(7) 🥇(10) 🔥(15) 💎(30) 👑(50) 🌟(100)

### Overall Daily Completion Streak Badges:
| Days | Badge | Icon |
|---|---|---|
| 3 | Rookie Warrior | ⚔️ |
| 7 | Week Champion | 🏆 |
| 10 | Discipline Seeker | 🎯 |
| 15 | Habit Hero | 🦸 |
| 21 | 21-Day Legend | 🌀 |
| 30 | Month Master | 💪 |
| 50 | Golden Streak | 🌟 |
| 100 | Century Champion | 👑 |

### Special Badges:
- **Early Bird** 🐦 — Wake up before 9 AM for 7 days straight  
- **Bookworm** 📖 — Read every day for 30 days  
- **Singing Star** ⭐ — Complete all singing tasks for 14 days  
- **Perfect Week** 🌈 — Complete 100% of tasks for 7 days straight  
- **Pooja Devotee** 🪔 — Evening Pooja for 30 days straight

---

## USER DASHBOARD (`/dashboard`) — RIDHAM'S VIEW

This is the heart of the app. Design it like a **game HUD**. Full creative liberty.

### Layout (Mobile-first, 3-section):

#### 1. TOP HERO SECTION
- Animated greeting: "Good Morning, Ridham! ☀️" (time-aware)
- Large XP/Level display with animated progress bar (total points → level system: every 500 pts = 1 level)
- Today's date prominently shown
- Current overall daily streak with animated flame 🔥
- Quick stats row: Today's Points | Chores Done / Total | Current Streak

#### 2. TODAY'S CHORES SECTION
- Card grid of today's applicable chores (filter by day of week)
- Each chore card shows:
  - Emoji icon (large, animated on hover/tap)
  - Chore title
  - Points value badge
  - Current streak for that specific chore (small flame counter)
  - **Completion checkbox** — big, satisfying, animated (plays confetti/particle burst on check)
  - **"Mark as Exception"** button (small, subtle) — opens a modal asking for reason, preserves streak
- Visual states:
  - Uncompleted: default card style
  - Completed: green glow, checkmark animation, card slightly "pops"
  - Exception: yellow/amber with a ⚡ icon
- When ALL chores are done: full-screen celebration animation + bonus points awarded

#### 3. BOTTOM TABS (sticky mobile nav):
- 🏠 Today
- 📅 History
- 🏆 Badges
- 📊 Stats

### History Tab (`/dashboard/history`):
- Calendar heatmap view (like GitHub contributions) — green = all complete, yellow = partial, red = missed
- Click any day → see that day's chore list with completion status
- Filter: This Week / This Month / All Time

### Badges Tab (`/dashboard/badges`):
- **Badge Cabinet** — grid of all badges
- Earned badges: full color, glowing, with earned date
- Unearned badges: grayscale/locked with progress indicator (e.g., "7/10 days")
- Clicking a badge shows full detail modal with description + how to earn it

### Stats Tab (`/dashboard/stats`):
- Total points, current level, XP to next level
- Per-chore streak leaderboard
- Points earned this week / month / all time
- Animated charts (bar/line) — use a lightweight chart library or CSS-only bars
- "Longest streak ever" trophy display

---

## ADMIN DASHBOARD (`/admin/dashboard`)

Clean, professional, but still themed consistently.

### Overview Panel:
- Ridham's current streak, today's completion %, total points
- Quick view of what's done today and what's pending (read-only mirror of user view)
- Notification if Ridham hasn't checked in yet today

### Chore Management (`/admin/chores`):
Full CRUD for chores. Very easy UI:

#### Add New Chore Form:
- **Title**: Text input (large, clean)
- **Description**: Textarea (optional)
- **Icon**: Emoji picker (grid of common emojis + free text input)
- **Points**: Number input with +/- stepper buttons (range: 5–100)
- **Recurrence**: 7 toggleable day buttons (Mon Tue Wed Thu Fri Sat Sun) — tap to toggle on/off, visual pill buttons
- **Active**: Toggle switch
- **Save**: Big animated button

#### Chore List:
- Drag-to-reorder (touch-friendly)
- Inline edit for points and active status
- Delete with confirmation modal
- Visual indicator: which days each chore applies to

### Badge Management (`/admin/badges`):
- View all badges and which ones Ridham has earned
- Award a badge manually (for special occasions)
- Create custom one-time badges

### Calendar View (`/admin/calendar`):
- Full month calendar
- Click any day → see/edit completions for that day
- Admin can retroactively mark chores complete or add exceptions
- Shows daily bonus awarded indicator

### Points Override:
- Admin can give/deduct bonus points with a note (e.g., "Extra effort today! +25 pts")
- All overrides logged with timestamp and reason

---

## GAMIFICATION DETAILS

### Level System:
```
Level 1:   0–499 pts      — Rookie
Level 2:   500–999 pts    — Apprentice  
Level 3:   1000–1999 pts  — Achiever
Level 4:   2000–3499 pts  — Champion
Level 5:   3500–5999 pts  — Hero
Level 6:   6000–9999 pts  — Legend
Level 7:   10000+ pts     — Grand Master ⭐
```
Display current level name + animated level-up effect when crossing threshold.

### Streak Logic:
- A chore streak increments if: completed OR marked as exception for that day
- Missing a scheduled day resets streak to 0
- Non-scheduled days (e.g., Sunday for Pranayama) are neutral — streak neither increments nor breaks
- Overall daily streak: ALL scheduled chores for the day completed or excepted

### Points Calculation:
- Each chore has admin-assigned points
- Daily all-complete bonus: +50 pts
- Admin manual bonus: variable
- No deductions for exceptions

### Animations & Celebrations:
- Checkbox completion: particle burst (CSS canvas or Framer Motion)
- All chores done: full-screen confetti + "🎉 PERFECT DAY!" message
- Badge earned: modal popup with badge spinning in, glow effect, sound option
- Level up: dramatic overlay with level name + animation
- Streak milestones (7, 14, 30 days): special screen takeover celebration

---

## UI / UX DESIGN DIRECTION

### Aesthetic: **"Cosmic Adventure RPG"**
- Dark mode default: deep space navy (`#0B0F2A`) with electric teal (`#00E5FF`) and warm amber (`#FFB347`) accents
- Light mode: soft cream (`#FFF8F0`) with same teal + amber accents, soft shadows
- Font: **"Baloo 2"** for all headings/display text (playful, rounded), **"Nunito"** for body text
- Cards with soft glass-morphism effect (backdrop-filter blur)
- Subtle star/particle background on hero section (CSS animation, not canvas-heavy)
- Streak flames: animated CSS fire emoji or SVG flame that grows with streak count
- XP bars: gradient-filled, animated fill on load
- Smooth page transitions with Framer Motion (slide/fade)
- Mobile: bottom tab nav, large tap targets (min 44px), thumb-friendly
- Tablet/Desktop: sidebar nav, content in centered max-width container

### Component Library of Custom Components to build:
1. `<ChoreCard />` — main interactive chore unit
2. `<XPBar />` — animated experience bar with level label
3. `<StreakFlame />` — animated flame with number
4. `<BadgeTile />` — earned/locked badge display
5. `<HeatmapCalendar />` — contribution-style history view
6. `<DayPicker />` — 7-day recurrence toggle for chore editing
7. `<EmojiPicker />` — simple emoji grid for chore icons
8. `<ConfettiBlast />` — triggered celebration component
9. `<LevelUpModal />` — dramatic level up overlay
10. `<ExceptionModal />` — mark chore as exception with reason
11. `<ThemeToggle />` — animated sun/moon toggle
12. `<PointsStepper />` — +/- point value input

---

## FILE STRUCTURE

```
chorequest/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx           # Google sign-in page
│   ├── (user)/
│   │   └── dashboard/
│   │       ├── page.tsx             # Today's chores
│   │       ├── history/page.tsx
│   │       ├── badges/page.tsx
│   │       └── stats/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── dashboard/page.tsx
│   │       ├── chores/page.tsx
│   │       ├── badges/page.tsx
│   │       └── calendar/page.tsx
│   ├── api/
│   │   ├── complete-chore/route.ts
│   │   ├── check-badges/route.ts
│   │   └── daily-bonus/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── chores/
│   ├── gamification/
│   ├── admin/
│   ├── ui/
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── streak-calculator.ts
│   ├── badge-checker.ts
│   ├── points-calculator.ts
│   └── types.ts
├── hooks/
│   ├── useChores.ts
│   ├── useStreaks.ts
│   └── useBadges.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── middleware.ts
├── tailwind.config.ts
├── vercel.json
└── .env.local.example
```

---

## API ROUTES & SERVER ACTIONS

### `POST /api/complete-chore`
- Body: `{ choreId, completedDate, isException, exceptionReason }`
- Saves completion, recalculates streak, checks + awards badges, awards daily bonus if all done
- Returns: `{ pointsEarned, newStreak, badgesAwarded, dailyBonusAwarded, allComplete }`

### `POST /api/check-badges`
- Triggered after every completion
- Checks all badge thresholds for the user
- Awards any newly earned badges
- Returns: `{ newBadges: Badge[] }`

### Server Actions (Next.js):
- `createChore(data)` — admin only
- `updateChore(id, data)` — admin only
- `deleteChore(id)` — admin only
- `adminAwardPoints(userId, points, reason)` — admin only
- `adminMarkComplete(choreId, date)` — admin only

---

## VERCEL DEPLOYMENT CONFIG

### `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  }
}
```

### README.md should include:
1. Prerequisites (Node 18+, Supabase CLI)
2. Supabase project setup steps
3. Google OAuth setup in Supabase Auth console
4. Steps to add authorized redirect URIs for both localhost and Vercel domain
5. How to run migrations: `supabase db push`
6. How to seed default chores: `supabase db seed`
7. Vercel deploy button + environment variable setup guide
8. How to add new users (update profiles table)

---

## IMPORTANT IMPLEMENTATION NOTES

1. **Supabase Realtime**: Subscribe to `chore_completions` on the admin dashboard so admins see Ridham's completions in real-time without refresh.

2. **Timezone handling**: All dates stored as `date` type in Supabase. Use the user's local timezone (India, IST UTC+5:30) for date calculations. Store a `timezone` field in profiles.

3. **Sunday exclusion logic**: When calculating streaks for Mon–Sat chores, Sundays are skipped automatically — not counted as a miss. The recurrence array on each chore drives this logic.

4. **Exception handling**: An exception marks the day as "valid skip" — streak is preserved, 0 points earned for that chore.

5. **Optimistic UI**: Mark chores complete optimistically in the UI, then confirm with server. On error, roll back with a toast notification.

6. **Loading states**: Every async action should have a loading skeleton or spinner, especially the badge check and streak calculation.

7. **Mobile gestures**: Chore cards should support swipe-right to complete on mobile (bonus UX touch).

8. **Accessibility**: All interactive elements must have proper ARIA labels, focus states, and keyboard navigation even though this is primarily touch-based.

9. **No external auth libraries**: Use Supabase Auth directly with `@supabase/ssr` package for SSR-compatible sessions.

10. **Image optimization**: Use `next/image` for any user avatars from Google OAuth.

---

## ACCEPTANCE CRITERIA

- [ ] Google login works for all 3 users
- [ ] Admin and user see different navigation and views
- [ ] Today's chores filter correctly by day of week
- [ ] Checking a chore saves to Supabase and updates streak
- [ ] Exception modal works and preserves streak
- [ ] Daily bonus awarded when all chores complete
- [ ] Badges awarded automatically on threshold reach
- [ ] History calendar shows correct heatmap data
- [ ] Admin can add/edit/delete chores
- [ ] Admin can view and retroactively edit any day
- [ ] Light and dark mode toggle works and persists
- [ ] App is fully responsive on 375px, 768px, 1280px viewports
- [ ] Deploys successfully on Vercel with env vars set
- [ ] All animations are smooth (60fps) and don't block interaction
- [ ] Streaks recalculate correctly across Sunday boundaries

---

*Start with: Project scaffold → Supabase schema + seed → Auth setup → User dashboard → Admin dashboard → Gamification logic → Animations → Testing → Vercel deploy config*
