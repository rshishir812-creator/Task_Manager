import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminContext } from "@/lib/auth-scope";

/**
 * POST /api/admin/super/family-tier  { familyId, tier: "free" | "premium" }
 *   Super-admin-only manual subscription override. Useful for granting Premium
 *   to real families before live billing exists.
 */
export async function POST(request: NextRequest) {
  const ctx = await getSuperAdminContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { familyId, tier } = await request.json() as { familyId?: string; tier?: string };
  if (!familyId) return NextResponse.json({ error: "familyId required" }, { status: 400 });
  if (tier !== "free" && tier !== "premium") {
    return NextResponse.json({ error: "tier must be 'free' or 'premium'" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("families")
    .update({
      subscription_tier: tier,
      premium_since: tier === "premium" ? new Date().toISOString() : null,
    })
    .eq("id", familyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, tier });
}
