import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPointsBalance } from "@/lib/rewards";
import type { Profile, Reward, RewardAssignment } from "@/lib/types";

/**
 * POST /api/redeem  { rewardId }
 *   Child (or parent on behalf of) creates a pending redemption request.
 *   Points are NOT deducted until a parent approves.
 *   But we still pre-check the child has enough balance to avoid embarrassing
 *   "you can't actually afford this" surprises at approval time.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rewardId } = await request.json() as { rewardId: string };
  if (!rewardId) return NextResponse.json({ error: "rewardId required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: profileData } = await admin
    .from("profiles")
    .select("id, family_id, role")
    .eq("id", user.id)
    .single();
  const profile = profileData as Pick<Profile, "id" | "family_id" | "role"> | null;
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Fetch reward + check it's in the user's family, active, and assigned to them
  const { data: rewardData } = await admin
    .from("rewards")
    .select("*")
    .eq("id", rewardId)
    .single();
  const reward = rewardData as Reward | null;
  if (!reward) return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  if (reward.family_id !== profile.family_id) {
    return NextResponse.json({ error: "Not in your family" }, { status: 403 });
  }
  if (!reward.is_active) {
    return NextResponse.json({ error: "Reward is not available" }, { status: 400 });
  }

  // Verify assignment
  const { data: assignment } = await admin
    .from("reward_assignments")
    .select("*")
    .eq("reward_id", rewardId)
    .eq("user_id", user.id)
    .maybeSingle();
  const ra = assignment as RewardAssignment | null;
  if (!ra || ra.removed_at !== null) {
    return NextResponse.json({ error: "This reward isn't available to you" }, { status: 403 });
  }

  // Pre-check balance (count pending requests as already spent too — soft reserve)
  const balance = await getPointsBalance(user.id);
  const { data: pendingData } = await admin
    .from("redemptions")
    .select("points_cost")
    .eq("user_id", user.id)
    .eq("status", "pending");
  const pendingSpent = ((pendingData as { points_cost: number }[] | null) ?? [])
    .reduce((s, r) => s + r.points_cost, 0);
  const effectiveBalance = balance.available - pendingSpent;

  if (reward.points_cost > effectiveBalance) {
    return NextResponse.json(
      { error: `Not enough points. You have ${effectiveBalance} available (${pendingSpent} reserved for pending requests).` },
      { status: 400 },
    );
  }

  const { data: created, error } = await admin
    .from("redemptions")
    .insert({
      family_id: profile.family_id,
      user_id: user.id,
      reward_id: reward.id,
      reward_title: reward.title,
      reward_icon: reward.icon ?? null,
      points_cost: reward.points_cost,
      status: "pending",
      decided_at: null,
      decided_by: null,
      decided_note: null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ redemption: created });
}

/**
 * DELETE /api/redeem?id=<redemptionId>
 *   Child cancels their own pending request.
 */
export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("redemptions")
    .select("user_id, status")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const e = existing as { user_id: string; status: string };
  if (e.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (e.status !== "pending") return NextResponse.json({ error: "Can only cancel pending" }, { status: 400 });

  const { error } = await admin.from("redemptions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
