import type { Badge, ChoreCompletion, Chore, UserBadge } from "./types";
import { computeChoreStreak, computeOverallStreak, getTodayIST } from "./streak-calculator";

export interface BadgeAwardResult {
  newBadges: Badge[];
}

/**
 * Checks all badge thresholds and returns any newly earned badges.
 * Caller is responsible for inserting into user_badges.
 */
export function checkBadges(
  badges: Badge[],
  userBadges: UserBadge[],
  chores: Chore[],
  completions: ChoreCompletion[],
  today: string = getTodayIST()
): BadgeAwardResult {
  const earnedIds = new Set(userBadges.map((ub) => ub.badge_id));
  const newBadges: Badge[] = [];

  const overallStreak = computeOverallStreak(chores, completions, today);

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;
    if (badge.threshold === null) continue;

    if (badge.chore_id === null) {
      // Overall streak badge
      if (badge.badge_type === "streak" && overallStreak >= badge.threshold) {
        newBadges.push(badge);
      }
    } else {
      // Per-chore streak badge
      const chore = chores.find((c) => c.id === badge.chore_id);
      if (!chore) continue;
      const choreStreak = computeChoreStreak(chore, completions, today);
      if (choreStreak >= badge.threshold) {
        newBadges.push(badge);
      }
    }
  }

  // Special badges (checked by code pattern)
  const specialChecks: Record<string, () => boolean> = {
    special_early_bird: () => {
      const wakeChore = chores.find((c) => c.title.toLowerCase().includes("wake up"));
      if (!wakeChore) return false;
      return computeChoreStreak(wakeChore, completions, today) >= 7;
    },
    special_bookworm: () => {
      const readChore = chores.find((c) => c.title.toLowerCase().includes("read"));
      if (!readChore) return false;
      return computeChoreStreak(readChore, completions, today) >= 30;
    },
    special_singing_star: () => {
      const singingChores = chores.filter(
        (c) =>
          c.title.toLowerCase().includes("singing") ||
          c.title.toLowerCase().includes("kharaj")
      );
      return singingChores.every(
        (c) => computeChoreStreak(c, completions, today) >= 14
      );
    },
    special_perfect_week: () => overallStreak >= 7,
    special_pooja_devotee: () => {
      const poojaChore = chores.find((c) => c.title.toLowerCase().includes("pooja"));
      if (!poojaChore) return false;
      return computeChoreStreak(poojaChore, completions, today) >= 30;
    },
  };

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;
    if (badge.badge_type !== "special") continue;
    const check = specialChecks[badge.code];
    if (check && check()) {
      newBadges.push(badge);
    }
  }

  return { newBadges };
}
