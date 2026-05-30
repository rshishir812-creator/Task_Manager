import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, isChildOfFamily } from "@/lib/auth-scope";
import { isValidQualityRating, pointsForRating } from "@/lib/quality-rating";
import type { Chore, ChoreCompletion } from "@/lib/types";

/**
 * POST /api/admin/completions/rate  { completionId, rating: 1|2|3|4|null }
 *
 * Sets / changes / clears the quality rating on an already-verified, non-
 * exception completion. Recomputes points_earned from the chore's base
 * points; null rating restores full points. No streak/bonus/badge recompute
 * (none of those depend on the point amount of an already-verified row).
 */
export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as { completionId?: string; rating?: number | null };
  const completionId = body.completionId;
  const rating = body.rating ?? null;
  if (!completionId) {
    return NextResponse.json({ error: "completionId required" }, { status: 400 });
  }
  if (rating !== null && !isValidQualityRating(rating)) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: completionData } = await admin
    .from("chore_completions")
    .select("*")
    .eq("id", completionId)
    .single();
  const completion = completionData as ChoreCompletion | null;
  if (!completion) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (completion.status !== "verified" || completion.is_exception) {
    return NextResponse.json({ error: "Only verified non-exception completions can be rated" }, { status: 400 });
  }

  if (!ctx.isSuperAdmin) {
    const ok = await isChildOfFamily(completion.user_id, ctx.familyId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: choreData } = await admin
    .from("chores")
    .select("*")
    .eq("id", completion.chore_id)
    .single();
  const chore = choreData as Chore | null;
  if (!chore) return NextResponse.json({ error: "Chore not found" }, { status: 404 });

  const pointsEarned = pointsForRating(chore.points, rating);

  const { error: updErr } = await admin
    .from("chore_completions")
    .update({
      quality_rating: rating,
      points_earned: pointsEarned,
    })
    .eq("id", completionId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, pointsEarned });
}
