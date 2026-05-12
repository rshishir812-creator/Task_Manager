import type { Badge, Chore, ChoreCompletion, UserBadge } from "./types";
import { computeChoreStreak, computeOverallStreak } from "./streak-calculator";

export type MilestoneProgress = {
  badge: Badge;
  current: number;
  target: number;
  distance: number;
  progressFraction: number;
  chore?: Chore;
};

type SpecialResult = { current: number; target: number; chore?: Chore } | null;

function streakOnChoreMatching(
  chores: Chore[],
  completions: ChoreCompletion[],
  today: string,
  keywords: string[],
  target: number
): SpecialResult {
  const chore = chores.find((c) =>
    keywords.some((k) => c.title.toLowerCase().includes(k))
  );
  if (!chore) return { current: 0, target };
  return {
    current: computeChoreStreak(chore, completions, today),
    target,
    chore,
  };
}

function minStreakAcrossMatching(
  chores: Chore[],
  completions: ChoreCompletion[],
  today: string,
  keywords: string[],
  target: number
): SpecialResult {
  const matching = chores.filter((c) =>
    keywords.some((k) => c.title.toLowerCase().includes(k))
  );
  if (matching.length === 0) return { current: 0, target };
  const min = Math.min(
    ...matching.map((c) => computeChoreStreak(c, completions, today))
  );
  return { current: min, target, chore: matching[0] };
}

// Mirrors the hard-coded thresholds in lib/badge-checker.ts.
const SPECIAL_HANDLERS: Record<
  string,
  (chores: Chore[], completions: ChoreCompletion[], today: string) => SpecialResult
> = {
  special_perfect_week: (chores, completions, today) => ({
    current: computeOverallStreak(chores, completions, today),
    target: 7,
  }),
  special_early_bird: (chores, completions, today) =>
    streakOnChoreMatching(chores, completions, today, ["wake up"], 7),
  special_bookworm: (chores, completions, today) =>
    streakOnChoreMatching(chores, completions, today, ["read"], 30),
  special_pooja_devotee: (chores, completions, today) =>
    streakOnChoreMatching(chores, completions, today, ["pooja"], 30),
  special_singing_star: (chores, completions, today) =>
    minStreakAcrossMatching(chores, completions, today, ["singing", "kharaj"], 14),
};

export function computeMilestones(args: {
  badges: Badge[];
  userBadges: UserBadge[];
  chores: Chore[];
  completions: ChoreCompletion[];
  today: string;
}): MilestoneProgress[] {
  const { badges, userBadges, chores, completions, today } = args;
  const earnedIds = new Set(userBadges.map((ub) => ub.badge_id));
  const results: MilestoneProgress[] = [];

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    let current: number | null = null;
    let target: number | null = null;
    let chore: Chore | undefined;

    if (badge.badge_type === "streak" && badge.threshold !== null) {
      target = badge.threshold;
      if (badge.chore_id === null) {
        current = computeOverallStreak(chores, completions, today);
      } else {
        const c = chores.find((ch) => ch.id === badge.chore_id);
        if (!c || !c.is_active) continue;
        chore = c;
        current = computeChoreStreak(c, completions, today);
      }
    } else if (badge.badge_type === "special") {
      const handler = SPECIAL_HANDLERS[badge.code];
      if (!handler) continue;
      const res = handler(chores, completions, today);
      if (!res) continue;
      current = res.current;
      target = res.target;
      chore = res.chore;
    }

    if (current === null || target === null || target <= 0) continue;
    if (current >= target) continue;

    const distance = target - current;
    const progressFraction = Math.max(0, Math.min(1, current / target));
    results.push({ badge, current, target, distance, progressFraction, chore });
  }

  results.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return b.progressFraction - a.progressFraction;
  });

  return results;
}
