import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";
import { getFamilyPlan, TRIAL_DAYS } from "@/lib/subscription";

/**
 * POST /api/parent/trial/start
 *   Starts the one-time 7-day free trial for the parent's family. Idempotent
 *   guard: refuses if a trial was already started or the family is on Premium.
 */
export async function POST() {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent") {
    return NextResponse.json({ error: "Only parents can start a trial" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: famData } = await admin
    .from("families")
    .select("trial_started_at, subscription_tier")
    .eq("id", ctx.familyId)
    .single();
  const fam = famData as { trial_started_at: string | null; subscription_tier: string } | null;
  if (!fam) return NextResponse.json({ error: "Family not found" }, { status: 404 });

  if (fam.subscription_tier === "premium") {
    return NextResponse.json({ error: "Your family is already on Premium." }, { status: 400 });
  }
  if (fam.trial_started_at !== null) {
    return NextResponse.json({ error: "Your free trial has already been used." }, { status: 400 });
  }

  const now = new Date();
  const ends = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);
  const { error } = await admin
    .from("families")
    .update({ trial_started_at: now.toISOString(), trial_ends_at: ends.toISOString() })
    .eq("id", ctx.familyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const plan = await getFamilyPlan(ctx.familyId);
  return NextResponse.json({ plan });
}
