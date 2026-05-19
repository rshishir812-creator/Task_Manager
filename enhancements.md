# ChoreQuest — Enhancement Roadmap

A prioritized list of ideas that could ship next, grouped into four phase buckets. Each phase has a clear "why this matters" framing so it's easy to scan and pick the next thing to build.

Effort tags: **S** (a few hours), **M** (one focused day), **L** (multiple days or new dependencies).

---

## ✅ Already shipped (for context)

These were on early lists but are now live:

- Phase 1a — Multi-tenant families, RLS isolation, open signup, super-admin role, child invitations
- Phase 1b — Deterministic preset onboarding wizard (age 4-6/7-10/11-13/14+), multi-child picker UI, family-name editing, remove-child, child avatars
- Phase 2 — Per-child chore assignments, co-parent invitations, "Ridham" removed from public copy
- Phase 3 — Temporal isolation of chore changes: past streaks are immutable when chores are added / removed / un-assigned. Soft-delete chores.
- Phase 4 — Rewards catalog + redemption flow (pending → approve/deny), per-child reward assignments, available-balance accounting

---

## Phase 5 — Quick wins

*Small effort, high value, no new infrastructure. These are the "ship this weekend" items.*

- **Email invitations** **[M]** — Today a parent has to share the invite email out-of-band. Add Resend or Supabase Auth invite emails so the invited child/co-parent gets a clickable "Join Rao Family on ChoreQuest" message. Needs SMTP setup + 1 new env var (`RESEND_API_KEY` or similar).

- **"Saving for" goal tracker** **[S]** — Let a child star one reward as their saving goal. A progress bar on `/dashboard` shows "350/1000 toward McDonald's Meal" alongside their XP bar. Single DB column on `profiles` (`saving_for_reward_id`) + tiny UI on the rewards page + a card on the dashboard.

- **Auto-approve flag per reward** **[S]** — Boolean on `rewards`. When on, child taps Redeem → points deducted immediately, no parent review needed. Useful for low-stakes rewards (a chocolate, 15 min screen time). Parent still gets a notification but no review queue.

- **Reward categories** **[S]** — Enum-like text on `rewards` (`treats` / `experiences` / `privileges` / `toys` / `time`). Group the catalog UI on both sides. Three lines of code + a category picker on the form.

- **Surprise rewards** **[S]** — Parent grants a reward to a child without a redemption request ("you were great this week, here's an ice cream"). Just an admin button on `/admin/redemptions` → "Grant reward → pick child + reward → confirm". Inserts a redemption with status=approved, decided_by=parent.

- **Reward inventory tracking** **[M]** — Optional `inventory` integer on `rewards`. When null = unlimited. When set, decrements on each approved redemption; child sees "3 left" on the catalog and reward is greyed out at 0. Parent can refill from the form.

- **Tiered visual hierarchy** **[S]** — Pure CSS: rewards under 100 pts get a small bronze ring, 100-500 silver, 500-2000 gold, 2000+ diamond. Makes the catalog scan as a wishlist.

---

## Phase 6 — The moat

*Medium effort, differentiated value. These are what makes ChoreQuest feel personal vs. a generic chore tracker.*

- **LLM-personalized onboarding** **[L]** — On step 3 of the onboarding wizard, add a "✨ Personalize with AI" button. Sends the parent's free-text ("my daughter is 8, loves soccer, struggles with reading") + the preset list to Anthropic Claude → returns a refined, customized list with bespoke titles, points, and recurrence. Needs `ANTHROPIC_API_KEY` and a small handler. ~$0.05/signup.

- **Wishlist mode** **[M]** — A "Suggest a reward" button on the child's rewards page. Creates a pending wishlist entry. Parent sees these on `/admin/rewards` with "Approve & add" or "Decline" — approved ones become real rewards. New table `reward_suggestions(id, family_id, user_id, title, note, status)`.

- **Streak multipliers** **[M]** — Perfect-week bonus: completing all chores 7 days in a row credits a 50-pt bonus to a "spendable pool" (separate from XP). Surfaced on the dashboard as "🔥 +50 streak bonus this week". Needs a per-week ledger + a small cron / on-completion check.

- **Multi-step achievements/quests** **[L]** — A new `quests` table with multi-day or multi-task goals. E.g., "Morning Hero" = complete Brush Teeth + Tidy Room + Eat Veggies, three days in a row. Earns a special badge or pool of points. Parent-definable; analogous to but bigger than the current per-chore streak ladder.

- **Recurrence-change versioning** **[L]** — The last gap from Phase 3. If a parent changes a chore's `recurrence` from Mon-Sun to Mon-Fri, weekend completions silently stop counting toward old streaks. Fix: a new `chore_recurrence_history(chore_id, recurrence, effective_from)` table, and the streak walker looks up the applicable recurrence row per date. Same pattern as `chore_assignments.created_at`.

- **Co-parent removal UI** **[S]** — Today only super admin can demote a parent via SQL. Add a small "Remove from family" button on `/admin/family` next to each parent (not yourself), with the same two-click confirm pattern as remove-child.

- **Family activity feed** **[L]** — Real-time list on `/admin/dashboard`: "Ridham completed Take Medicines at Night just now • Anjali earned Bronze Dose 2 minutes ago". Uses Supabase realtime channels on `chore_completions` + `user_badges`. Sticky panel on the right (or a separate `/admin/activity` page).

---

## Phase 7 — Infrastructure

*Larger effort, requires new dependencies or operational changes. Take these on when there's a real need.*

- **Service Worker + Web Push** **[L]** — True OS-level push notifications that fire when the browser tab is closed. Needs VAPID keys, a service worker file, a server endpoint to store push subscriptions, and a Vercel Cron job at 1pm and 8pm IST that fans out reminders. The current `ReminderManager` falls back to in-page banners — this replaces it.

- **Calendar sync** **[L]** — One-way sync of today's chores into Google Calendar (parent or child). Useful for parents who live in their calendar. Needs Google Calendar API integration + OAuth scope expansion + a per-user toggle.

- **Print/export monthly reports** **[M]** — Parent clicks "Export" on stats → generates a PDF with the kid's chore completion grid, points earned, badges, and rewards redeemed. Use a server-side PDF library (e.g., `@react-pdf/renderer`).

- **Mobile app shell (PWA install prompt)** **[M]** — App is already a Next.js PWA-friendly site. Add `manifest.json`, app icons, an "Install" CTA on first visit, and tweak the splash screen. Removes the URL-bar friction for kids.

- **Permanent delete** **[S]** — Currently "delete chore" is soft-delete; "delete child" cascades but their `auth.users` row stays. Add a "Permanently delete" button (super admin or a 2-step confirm for parents) that fully purges. Useful when a parent typo'd a chore and wants it gone.

- **Multi-language support** **[L]** — `next-intl` integration with English/Hindi/Spanish/Mandarin. All hardcoded strings extracted to translation files. Probably premature unless the user base demands it.

- **Backups + per-family data export** **[M]** — A button on `/admin/family` → "Export family data as JSON". Useful for the "delete my account" flow and GDPR-style trust signals.

---

## Phase 8 — Polish & nice-to-haves

*Low priority, edge cases. The kind of thing you'd build if everything else were done.*

- **Reward redemption photos** **[M]** — When a parent approves a redemption, optional "snap a pic of them enjoying it" button. Stored in Supabase storage. Shows up in the child's history with a thumbnail.

- **Pay-it-forward** **[S]** — Child can donate some of their points to a sibling. UI: "Give 50 pts to Anjali → confirm". Inserts a paired set of redemptions or a new `point_transfers` table.

- **Family pool** **[M]** — Shared points across all kids in the family that unlocks family-level rewards (movie night, restaurant outing). Each kid contributes a percentage of their earnings into the pool.

- **Birthday bonus** **[S]** — `profiles.birthdate` (already could be optional). Trigger on the day-of grants a 500-pt bonus + a balloon emoji on the dashboard.

- **Theme customization per kid** **[S]** — Each child picks an accent colour (teal / amber / purple / pink). Stored on `profiles.theme`. Tailwind CSS variables already exist; just need a picker UI.

- **Per-chore "missed because sick" notes** **[S]** — When marking exception on a chore, child can pick a reason from a list (sick, traveling, busy, other) or add free text. Already partially supported via `chore_completions.exception_reason` — needs UI to expose it.

- **Parent dashboard analytics** **[M]** — Charts on `/admin/dashboard`: completion-rate trend over the last 30 days, top-performing chores, hardest-to-stick chores. Uses the existing `chore_completions` data; no new tables.

- **Cross-family leaderboard (super admin)** **[S]** — Super admin sees a leaderboard of which families are most engaged. Useful for the original "couple of parents" who asked for this to feel a bit more communal. Make it opt-in per family for privacy.

- **In-app reward fulfilment notification** **[S]** — When a parent approves a redemption, child gets a toast next time they open the app: "🎉 Mom approved your McDonald's Meal! Ask her when you're ready."

- **Streak repair tokens** **[M]** — Earn 1 "repair token" per perfect month. Spend a token to undo a missed day on the streak. Gentle protection against vacation gaps.

---

## How to use this doc

1. Pick a phase (5 is "ship next"; 8 is "if bored").
2. Pick one item from that phase.
3. Ask Claude to plan + implement it. The plan file lives at `/root/.claude/plans/`.
4. Update this file: move the item to "Already shipped" with the commit SHA.

Nothing in this list is contractual — reorder freely as real users surface real pain points.
