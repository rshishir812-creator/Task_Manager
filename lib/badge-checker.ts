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

    if (badge.badge_type === "milestone" && badge.chore_id !== null) {
      const count = completions.filter(
        (c) => c.chore_id === badge.chore_id && !c.is_exception
      ).length;
      if (count >= badge.threshold) {
        newBadges.push(badge);
      }
      continue;
    }

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

  // Prefer the badge's chore_id FK; fall back to keyword if the badge has no FK
  // (legacy seeded rows, or specials that span multiple chores).
  const resolveChore = (badge: Badge, keywords: string[]): Chore | undefined => {
    if (badge.chore_id) {
      const c = chores.find((ch) => ch.id === badge.chore_id);
      if (c) return c;
    }
    return chores.find((c) =>
      keywords.some((k) => c.title.toLowerCase().includes(k))
    );
  };

  // Special badges (checked by code pattern)
  const specialChecks: Record<string, (badge: Badge) => boolean> = {
    special_early_bird: (badge) => {
      const chore = resolveChore(badge, ["wake up"]);
      if (!chore) return false;
      return computeChoreStreak(chore, completions, today) >= 7;
    },
    special_bookworm: (badge) => {
      const chore = resolveChore(badge, ["read"]);
      if (!chore) return false;
      return computeChoreStreak(chore, completions, today) >= 30;
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
    special_pooja_devotee: (badge) => {
      const chore = resolveChore(badge, ["pooja"]);
      if (!chore) return false;
      return computeChoreStreak(chore, completions, today) >= 30;
    },
    special_pill_paladin: (badge) => {
      const chore = resolveChore(badge, ["medicine"]);
      if (!chore) return false;
      return computeChoreStreak(chore, completions, today) >= 50;
    },
  };

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;
    if (badge.badge_type !== "special") continue;
    const check = specialChecks[badge.code];
    if (check && check(badge)) {
      newBadges.push(badge);
    }
  }

  return { newBadges };
}
