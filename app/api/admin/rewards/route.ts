import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, getChildrenOfFamily } from "@/lib/auth-scope";
import { getFamilyPlan, upgradeRequiredResponse } from "@/lib/subscription";
import type { Reward } from "@/lib/types";

interface CreateRewardBody {
  title: string;
  description?: string | null;
  icon?: string;
  points_cost: number;
  assignedTo?: string[];
}

export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent" && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rewards are a Premium feature.
  const plan = await getFamilyPlan(ctx.familyId);
  if (!plan.hasPremiumAccess) {
    return upgradeRequiredResponse("Rewards are a Premium feature. Upgrade to create rewards your kids can redeem.");
  }

  const body = await request.json() as CreateRewardBody;
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (!body.points_cost || body.points_cost <= 0) {
    return NextResponse.json({ error: "Points cost must be positive" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Validate assignedTo (every id must be a child of this family)
  const allChildren = await getChildrenOfFamily(ctx.familyId);
  const familyChildIds = new Set(allChildren.map((c) => c.id));
  const targetIds = Array.isArray(body.assignedTo)
    ? body.assignedTo.filter((id) => familyChildIds.has(id))
    : allChildren.map((c) => c.id); // default: all current children

  // Determine next sort_order
  const { data: existing } = await admin
    .from("rewards")
    .select("sort_order")
    .eq("family_id", ctx.familyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSort = ((existing as { sort_order: number }[] | null)?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from("rewards")
    .insert({
      family_id: ctx.familyId,
      title,
      description: body.description?.trim() || null,
      icon: body.icon || "🎁",
      points_cost: body.points_cost,
      is_active: true,
      deactivated_at: null,
      created_by: ctx.user.id,
      sort_order: nextSort,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const reward = data as Reward;

  if (targetIds.length > 0) {
    await admin.from("reward_assignments").insert(
      targetIds.map((user_id) => ({
        reward_id: reward.id,
        user_id,
        created_at: new Date().toISOString(),
        removed_at: null,
      })),
    );
  }

  return NextResponse.json({ reward });
}
