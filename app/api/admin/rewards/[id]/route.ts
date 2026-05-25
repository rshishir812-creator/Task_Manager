import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, getChildrenOfFamily } from "@/lib/auth-scope";
import { getFamilyPlan, upgradeRequiredResponse } from "@/lib/subscription";
import type { Reward } from "@/lib/types";

interface PatchRewardBody {
  title?: string;
  description?: string | null;
  icon?: string;
  points_cost?: number;
  is_active?: boolean;
  assignedTo?: string[];
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const plan = await getFamilyPlan(ctx.familyId);
  if (!plan.hasPremiumAccess) {
    return upgradeRequiredResponse("Rewards are a Premium feature. Upgrade to manage rewards.");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rewards")
    .select("family_id")
    .eq("id", params.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((existing as { family_id: string }).family_id !== ctx.familyId && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as PatchRewardBody;
  const { assignedTo, ...rewardFields } = body;

  // Don't let callers change family_id
  delete (rewardFields as { family_id?: string }).family_id;

  // If updating points_cost, validate
  if (rewardFields.points_cost !== undefined && rewardFields.points_cost <= 0) {
    return NextResponse.json({ error: "Points cost must be positive" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("rewards")
    .update(rewardFields)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Handle assignedTo with temporal-safe merge (mirrors chore_assignments pattern)
  if (Array.isArray(assignedTo)) {
    const allChildren = await getChildrenOfFamily(ctx.familyId);
    const familyChildIds = new Set(allChildren.map((c) => c.id));
    const target = new Set(assignedTo.filter((id) => familyChildIds.has(id)));

    const { data: existingRows } = await admin
      .from("reward_assignments")
      .select("user_id, removed_at")
      .eq("reward_id", params.id);
    const existingMap = new Map<string, { removed_at: string | null }>(
      ((existingRows as { user_id: string; removed_at: string | null }[] | null) ?? [])
        .map((r) => [r.user_id, { removed_at: r.removed_at }]),
    );

    const now = new Date().toISOString();

    for (const userId of Array.from(target)) {
      const row = existingMap.get(userId);
      if (!row) {
        await admin.from("reward_assignments").insert({
          reward_id: params.id,
          user_id: userId,
          created_at: now,
          removed_at: null,
        });
      } else if (row.removed_at !== null) {
        await admin
          .from("reward_assignments")
          .update({ removed_at: null, created_at: now })
          .eq("reward_id", params.id)
          .eq("user_id", userId);
      }
    }

    for (const [userId, row] of Array.from(existingMap.entries())) {
      if (target.has(userId)) continue;
      if (row.removed_at !== null) continue;
      await admin
        .from("reward_assignments")
        .update({ removed_at: now })
        .eq("reward_id", params.id)
        .eq("user_id", userId);
    }
  }

  return NextResponse.json({ reward: data as Reward });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const plan = await getFamilyPlan(ctx.familyId);
  if (!plan.hasPremiumAccess) {
    return upgradeRequiredResponse("Rewards are a Premium feature. Upgrade to manage rewards.");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rewards")
    .select("family_id")
    .eq("id", params.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((existing as { family_id: string }).family_id !== ctx.familyId && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft delete: flip is_active. Trigger sets deactivated_at. Past redemptions
  // remain intact via the snapshot fields.
  const { error } = await admin
    .from("rewards")
    .update({ is_active: false })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
