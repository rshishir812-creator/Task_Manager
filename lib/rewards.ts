import { createAdminClient } from "@/lib/supabase/admin";
import type { ChoreCompletion, DailyBonus, Redemption } from "@/lib/types";

export interface PointsBalance {
  earned: number;
  spent: number;
  available: number;
}

/**
 * Returns lifetime earned XP, total points spent on approved redemptions, and
 * the current spendable balance. Level / XP bar uses `earned` (level never
 * decreases); the rewards page shows `available`.
 */
export async function getPointsBalance(userId: string): Promise<PointsBalance> {
  const admin = createAdminClient();
  const [completionsRes, bonusesRes, redemptionsRes] = await Promise.all([
    // Only verified completions count toward earned XP
    admin.from("chore_completions").select("points_earned").eq("user_id", userId).eq("status", "verified"),
    admin.from("daily_bonuses").select("points_bonus").eq("user_id", userId),
    admin.from("redemptions").select("points_cost").eq("user_id", userId).eq("status", "approved"),
  ]);

  const completions = (completionsRes.data as Pick<ChoreCompletion, "points_earned">[] | null) ?? [];
  const bonuses = (bonusesRes.data as Pick<DailyBonus, "points_bonus">[] | null) ?? [];
  const approvedRedemptions = (redemptionsRes.data as Pick<Redemption, "points_cost">[] | null) ?? [];

  const earned =
    completions.reduce((s, c) => s + (c.points_earned ?? 0), 0) +
    bonuses.reduce((s, b) => s + b.points_bonus, 0);
  const spent = approvedRedemptions.reduce((s, r) => s + r.points_cost, 0);

  return { earned, spent, available: Math.max(0, earned - spent) };
}
