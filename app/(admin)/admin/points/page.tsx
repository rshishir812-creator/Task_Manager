import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import PointsOverridePanel from "@/components/admin/PointsOverridePanel";
import { getParentContext, resolveChild, getChildrenOfFamily } from "@/lib/auth-scope";
import ChildPicker from "@/components/admin/ChildPicker";
import Link from "next/link";
import { sumChallengeXp } from "@/lib/xp";
import type { ChoreCompletion, DailyBonus, ChallengeClaim } from "@/lib/types";

export default async function AdminPointsPage({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const adminClient = createAdminClient();
  const [child, allChildren] = await Promise.all([
    resolveChild(ctx.familyId, searchParams, ctx.isSuperAdmin),
    getChildrenOfFamily(ctx.familyId),
  ]);

  if (!child) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-fg">Points Override 💰</h1>
        <p className="text-sm text-fg-muted">No children added yet.</p>
        <Link href="/admin/family" className="text-sm text-accent-amber">Add a child →</Link>
      </div>
    );
  }

  const ridham = child;

  const [{ data: completionsData }, { data: bonusesData }, { data: claimsData }] = await Promise.all([
    adminClient.from("chore_completions").select("points_earned").eq("user_id", ridham.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", ridham.id),
    adminClient.from("challenge_claims").select("reward_points").eq("user_id", ridham.id),
  ]);

  const completions = (completionsData as Pick<ChoreCompletion, "points_earned">[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];
  const claims = (claimsData as Pick<ChallengeClaim, "reward_points">[] | null) ?? [];

  const totalPoints =
    completions.reduce((s, c) => s + (c.points_earned ?? 0), 0) +
    bonuses.reduce((s, b) => s + b.points_bonus, 0) +
    sumChallengeXp(claims);

  // Manual overrides are stored with dates >= 9000-01-01
  const overrides = bonuses
    .filter((b) => b.bonus_date >= "9000-01-01")
    .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime());

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Points Override 💰</h1>
        <p className="text-sm text-fg-muted mt-1">
          Award bonus or deduct points from {ridham.name?.split(" ")[0] ?? "child"}&apos;s total
        </p>
      </div>
      <ChildPicker kids={allChildren} currentChildId={ridham.id} />
      <PointsOverridePanel
        userId={ridham.id}
        userName={ridham.name?.split(" ")[0] ?? "child"}
        totalPoints={totalPoints}
        initialOverrides={overrides}
      />
    </div>
  );
}
