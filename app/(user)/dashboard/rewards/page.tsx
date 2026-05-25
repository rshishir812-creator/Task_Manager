import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFamilyPlan } from "@/lib/subscription";
import { getPointsBalance } from "@/lib/rewards";
import RewardsCatalog from "@/components/chores/RewardsCatalog";
import type { Profile, Reward, Redemption } from "@/lib/types";

export default async function ChildRewardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profileData } = await admin
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  const profile = profileData as Pick<Profile, "family_id"> | null;
  if (!profile) redirect("/login");

  // Rewards are a Premium feature. On a Free family the catalog is simply empty
  // (the existing "no rewards yet" state) — no upgrade/payment wording reaches kids.
  const plan = await getFamilyPlan(profile.family_id);

  // 1. All currently-assigned (active, not removed) rewards for this user
  const { data: assignmentRows } = await admin
    .from("reward_assignments")
    .select("reward_id")
    .eq("user_id", user.id)
    .is("removed_at", null);
  const assignedIds = ((assignmentRows as { reward_id: string }[] | null) ?? [])
    .map((a) => a.reward_id);

  let rewards: Reward[] = [];
  if (plan.hasPremiumAccess && assignedIds.length > 0) {
    const { data: rewardData } = await admin
      .from("rewards")
      .select("*")
      .in("id", assignedIds)
      .eq("is_active", true)
      .order("points_cost");
    rewards = (rewardData as Reward[] | null) ?? [];
  }

  // 2. This user's redemption history (recent first)
  const { data: redemptionsData } = await admin
    .from("redemptions")
    .select("*")
    .eq("user_id", user.id)
    .order("requested_at", { ascending: false })
    .limit(50);
  const redemptions = (redemptionsData as Redemption[] | null) ?? [];

  // 3. Points balance
  const balance = await getPointsBalance(user.id);

  return (
    <RewardsCatalog
      rewards={rewards}
      redemptions={redemptions}
      balance={balance}
    />
  );
}
