import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, isChildOfFamily } from "@/lib/auth-scope";
import { getPointsBalance } from "@/lib/rewards";
import type { Redemption } from "@/lib/types";

/**
 * POST /api/admin/redemptions/[id]
 *   Body: { action: "approve" | "deny", note?: string }
 *
 * Approve: validates the child still has the balance, then sets status =
 *          "approved". The getPointsBalance() function subtracts approved
 *          redemptions from earned, so the available pool drops immediately.
 *
 * Deny:    status = "denied" with optional note. Points untouched.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, note } = await request.json() as { action: "approve" | "deny"; note?: string };
  if (action !== "approve" && action !== "deny") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: redemptionData } = await admin
    .from("redemptions")
    .select("*")
    .eq("id", params.id)
    .single();
  const redemption = redemptionData as Redemption | null;
  if (!redemption) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (redemption.status !== "pending") {
    return NextResponse.json({ error: "Already decided" }, { status: 400 });
  }

  // Authorization: must be parent of the redeeming child (or super admin)
  if (!ctx.isSuperAdmin) {
    const ok = await isChildOfFamily(redemption.user_id, ctx.familyId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "approve") {
    // Re-check balance — child shouldn't go negative even if other redemptions
    // were approved between when this request was made and now.
    const balance = await getPointsBalance(redemption.user_id);
    if (redemption.points_cost > balance.available) {
      return NextResponse.json(
        { error: `Insufficient balance: ${balance.available} available, ${redemption.points_cost} required.` },
        { status: 400 },
      );
    }
  }

  const { data, error } = await admin
    .from("redemptions")
    .update({
      status: action === "approve" ? "approved" : "denied",
      decided_at: new Date().toISOString(),
      decided_by: ctx.user.id,
      decided_note: note?.trim() || null,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ redemption: data });
}
