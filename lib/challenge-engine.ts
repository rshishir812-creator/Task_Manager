import type { Challenge, ChallengeGoalType, ChoreCompletion, DailyBonus } from "./types";

// ------------------------------------------------------------------
// Weekly Quests — auto-rotating, time-boxed family goals.
//
// Zero parent setup and no cron: each ISO week a single quest is picked
// deterministically from the catalog and lazily inserted the first time the
// dashboard or a completion runs. Progress is computed READ-ONLY over existing
// verified completions / daily bonuses in the week window — it never writes to
// or changes any existing chore/streak/XP data.
// ------------------------------------------------------------------

export interface ChallengeTemplate {
  code: string;
  title: string;
  description: string;
  icon: string;
  goal_type: ChallengeGoalType;
  goal_target: number;
  reward_points: number;
}

// Rotation catalog. Kept family-agnostic (no dependence on specific chore
// titles) so it works for any family. Rotates by ISO-week index.
export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  { code: "weekly_grind_20",  title: "Weekly Grind",   description: "Finish 20 quests this week",          icon: "🎯", goal_type: "chores_completed", goal_target: 20, reward_points: 150 },
  { code: "perfect_days_3",   title: "Triple Perfect", description: "Score 3 Perfect Days this week",      icon: "🌈", goal_type: "perfect_days",     goal_target: 3,  reward_points: 200 },
  { code: "early_bird_5",     title: "Early Bird",     description: "Finish 5 quests before 9 AM",         icon: "🐦", goal_type: "early_bird",       goal_target: 5,  reward_points: 150 },
  { code: "big_week_30",      title: "Big Week",       description: "Crush 30 quests this week",           icon: "🔥", goal_type: "chores_completed", goal_target: 30, reward_points: 220 },
  { code: "top_effort_5",     title: "Top Effort",     description: "Earn 5 top-effort (4-star) ratings",  icon: "⭐", goal_type: "high_quality",     goal_target: 5,  reward_points: 200 },
  { code: "perfect_days_5",   title: "High Five",      description: "Score 5 Perfect Days this week",      icon: "👑", goal_type: "perfect_days",     goal_target: 5,  reward_points: 280 },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Monday–Sunday week window (in date strings) containing `todayStr`. */
export function getWeekPeriod(todayStr: string): { start: string; end: string; index: number } {
  const d = new Date(`${todayStr}T12:00:00Z`);
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const mondayOffset = (dow + 6) % 7; // days since Monday
  const start = new Date(d.getTime() - mondayOffset * MS_PER_DAY);
  const end = new Date(start.getTime() + 6 * MS_PER_DAY);
  const startStr = start.toISOString().slice(0, 10);
  // Stable integer week index for deterministic rotation.
  const index = Math.floor(start.getTime() / MS_PER_DAY / 7);
  return { start: startStr, end: end.toISOString().slice(0, 10), index };
}

/** The template active for the week containing `todayStr`. */
export function templateForWeek(todayStr: string): { template: ChallengeTemplate; start: string; end: string } {
  const { start, end, index } = getWeekPeriod(todayStr);
  const template = CHALLENGE_TEMPLATES[index % CHALLENGE_TEMPLATES.length]!;
  return { template, start, end };
}

/** IST clock hour (0–23) for an ISO timestamp, or null. */
function istHour(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (isNaN(t.getTime())) return null;
  return new Date(t.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
}

export interface ChallengeProgress {
  current: number;
  target: number;
  complete: boolean;
}

/**
 * READ-ONLY progress for a challenge over the user's data within its window.
 * `perfect_days` reuses existing daily_bonuses rows (one per perfect day).
 */
export function computeChallengeProgress(
  challenge: Challenge,
  data: { completions: ChoreCompletion[]; dailyBonuses: DailyBonus[] }
): ChallengeProgress {
  const { period_start: start, period_end: end, goal_target: target, goal_type } = challenge;
  const inWindow = (date: string) => date >= start && date <= end;

  const verified = data.completions.filter(
    (c) => c.status === "verified" && !c.is_exception && inWindow(c.completed_date)
  );

  let current = 0;
  switch (goal_type) {
    case "chores_completed":
      current = verified.length;
      break;
    case "perfect_days":
      current = data.dailyBonuses.filter((b) => inWindow(b.bonus_date)).length;
      break;
    case "high_quality":
      current = verified.filter((c) => c.quality_rating === 4).length;
      break;
    case "early_bird": {
      current = verified.filter((c) => {
        const h = istHour(c.completed_at);
        return h !== null && h < 9;
      }).length;
      break;
    }
  }

  return { current, target, complete: current >= target };
}
