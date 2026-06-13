// Server-only: imports the service-role admin client. Never import this from a
// client component — use lib/challenge-engine (pure) for shared logic instead.
import { createAdminClient } from "@/lib/supabase/admin";
import { templateForWeek } from "@/lib/challenge-engine";
import type { Challenge } from "@/lib/types";

/**
 * Ensure this week's quest row exists for the family and return the active
 * challenge(s) for the current week. Idempotent (unique on family+code+period),
 * so concurrent callers (dashboard load + completion) never duplicate.
 */
export async function ensureActiveChallenges(
  familyId: string,
  todayStr: string
): Promise<Challenge[]> {
  const admin = createAdminClient();
  const { template, start, end } = templateForWeek(todayStr);

  const { data: existing } = await admin
    .from("challenges")
    .select("*")
    .eq("family_id", familyId)
    .eq("period_start", start);

  if (existing && existing.length > 0) return existing as Challenge[];

  // Insert (ignore unique-violation races), then re-read.
  await admin.from("challenges").insert({
    family_id: familyId,
    code: template.code,
    title: template.title,
    description: template.description,
    icon: template.icon,
    goal_type: template.goal_type,
    goal_target: template.goal_target,
    reward_points: template.reward_points,
    period_start: start,
    period_end: end,
    is_active: true,
  });

  const { data: reread } = await admin
    .from("challenges")
    .select("*")
    .eq("family_id", familyId)
    .eq("period_start", start);

  return (reread as Challenge[] | null) ?? [];
}
