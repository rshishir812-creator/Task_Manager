import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, getChildrenOfFamily } from "@/lib/auth-scope";
import RewardManager from "@/components/admin/RewardManager";
import type { Reward, RewardAssignment } from "@/lib/types";

export default async function AdminRewardsPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const admin = createAdminClient();
  const [{ data: rewardsData }, kids] = await Promise.all([
    admin.from("rewards").select("*").eq("family_id", ctx.familyId).order("sort_order"),
    getChildrenOfFamily(ctx.familyId),
  ]);

  const rewards = (rewardsData as Reward[] | null) ?? [];
  const rewardIds = rewards.map((r) => r.id);

  let assignments: RewardAssignment[] = [];
  if (rewardIds.length > 0) {
    const { data: assignmentsData } = await admin
      .from("reward_assignments")
      .select("*")
      .in("reward_id", rewardIds);
    assignments = (assignmentsData as RewardAssignment[] | null) ?? [];
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Rewards 🎁</h1>
        <p className="text-sm text-fg-muted mt-1">
          Define rewards your child can redeem with their earned points.
        </p>
      </div>
      <RewardManager initialRewards={rewards} kids={kids} initialAssignments={assignments} />
    </div>
  );
}
