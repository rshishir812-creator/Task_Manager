import type { Badge, Chore, ChoreAssignment, ChoreCompletion, UserBadge } from "./types";
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
  target: number,
  choreId: string | null | undefined,
  assignment: ChoreAssignment | undefined
): SpecialResult {
  let chore: Chore | undefined;
  if (choreId) chore = chores.find((c) => c.id === choreId);
  if (!chore) {
    chore = chores.find((c) =>
      keywords.some((k) => c.title.toLowerCase().includes(k))
    );
  }
  if (!chore) return { current: 0, target };
  return {
    current: computeChoreStreak(chore, completions, today, assignment),
    target,
    chore,
  };
}

function minStreakAcrossMatching(
  chores: Chore[],
  completions: ChoreCompletion[],
  today: string,
  keywords: string[],
  target: number,
  assignmentByChoreId: Map<string, ChoreAssignment>
): SpecialResult {
  const matching = chores.filter((c) =>
    keywords.some((k) => c.title.toLowerCase().includes(k))
  );
  if (matching.length === 0) return { current: 0, target };
  const min = Math.min(
    ...matching.map((c) =>
      computeChoreStreak(c, completions, today, assignmentByChoreId.get(c.id))
    )
  );
  return { current: min, target, chore: matching[0] };
}

// Mirrors the hard-coded thresholds in lib/badge-checker.ts.
const SPECIAL_HANDLERS: Record<
  string,
  (
    badge: Badge,
    chores: Chore[],
    completions: ChoreCompletion[],
    today: string,
    assignmentByChoreId: Map<string, ChoreAssignment>,
    assignments: ChoreAssignment[]
  ) => SpecialResult
> = {
  special_perfect_week: (_badge, chores, completions, today, _abc, assignments) => ({
    current: computeOverallStreak(chores, completions, today, assignments),
    target: 7,
  }),
  special_early_bird: (badge, chores, completions, today, abc) =>
    streakOnChoreMatching(chores, completions, today, ["wake up"], 7, badge.chore_id, abc.get(badge.chore_id ?? "")),
  special_bookworm: (badge, chores, completions, today, abc) =>
    streakOnChoreMatching(chores, completions, today, ["read"], 30, badge.chore_id, abc.get(badge.chore_id ?? "")),
  special_pooja_devotee: (badge, chores, completions, today, abc) =>
    streakOnChoreMatching(chores, completions, today, ["pooja"], 30, badge.chore_id, abc.get(badge.chore_id ?? "")),
  special_singing_star: (_badge, chores, completions, today, abc) =>
    minStreakAcrossMatching(chores, completions, today, ["singing", "kharaj"], 14, abc),
  special_pill_paladin: (badge, chores, completions, today, abc) =>
    streakOnChoreMatching(chores, completions, today, ["medicine"], 50, badge.chore_id, abc.get(badge.chore_id ?? "")),
};

export function computeMilestones(args: {
  badges: Badge[];
  userBadges: UserBadge[];
  chores: Chore[];
  completions: ChoreCompletion[];
  today: string;
  assignments?: ChoreAssignment[];
}): MilestoneProgress[] {
  const { badges, userBadges, chores, completions, today, assignments } = args;
  const earnedIds = new Set(userBadges.map((ub) => ub.badge_id));
  const results: MilestoneProgress[] = [];

  const assignmentByChoreId = new Map<string, ChoreAssignment>();
  if (assignments) {
    for (const a of assignments) assignmentByChoreId.set(a.chore_id, a);
  }
  const safeAssignments = assignments ?? [];

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    let current: number | null = null;
    let target: number | null = null;
    let chore: Chore | undefined;

    if (badge.badge_type === "streak" && badge.threshold !== null) {
      target = badge.threshold;
      if (badge.chore_id === null) {
        current = computeOverallStreak(chores, completions, today, assignments);
      } else {
        const c = chores.find((ch) => ch.id === badge.chore_id);
        if (!c || !c.is_active) continue;
        chore = c;
        current = computeChoreStreak(c, completions, today, assignmentByChoreId.get(c.id));
      }
    } else if (badge.badge_type === "special") {
      const handler = SPECIAL_HANDLERS[badge.code];
      if (!handler) continue;
      const res = handler(badge, chores, completions, today, assignmentByChoreId, safeAssignments);
      if (!res) continue;
      current = res.current;
      target = res.target;
      chore = res.chore;
    } else if (badge.badge_type === "milestone" && badge.chore_id !== null && badge.threshold !== null) {
      const c = chores.find((ch) => ch.id === badge.chore_id);
      if (!c) continue;
      chore = c;
      target = badge.threshold;
      current = completions.filter(
        (cc) => cc.chore_id === badge.chore_id && !cc.is_exception
      ).length;
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
