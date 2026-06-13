import type { ChoreCompletion, DailyBonus, ChallengeClaim } from "./types";

// XP is computed, never stored. These helpers sum whatever arrays the caller
// already fetched. Phase 7 adds the third (challenge) term — it only ever
// INCREASES a total, so historical XP/levels can never drop.

export function sumCompletionXp(completions: Pick<ChoreCompletion, "points_earned">[]): number {
  return completions.reduce((s, c) => s + (c.points_earned ?? 0), 0);
}

export function sumBonusXp(bonuses: Pick<DailyBonus, "points_bonus">[]): number {
  return bonuses.reduce((s, b) => s + b.points_bonus, 0);
}

export function sumChallengeXp(claims: Pick<ChallengeClaim, "reward_points">[]): number {
  return claims.reduce((s, c) => s + (c.reward_points ?? 0), 0);
}

export function getTotalXp(args: {
  completions: Pick<ChoreCompletion, "points_earned">[];
  bonuses: Pick<DailyBonus, "points_bonus">[];
  claims: Pick<ChallengeClaim, "reward_points">[];
}): number {
  return sumCompletionXp(args.completions) + sumBonusXp(args.bonuses) + sumChallengeXp(args.claims);
}
