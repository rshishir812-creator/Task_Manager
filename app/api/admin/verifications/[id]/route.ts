import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, isChildOfFamily } from "@/lib/auth-scope";
import { checkBadges } from "@/lib/badge-checker";
import {
  computeChoreStreak,
  computeOverallStreak,
  getChoresForDay,
  getDayOfWeek,
} from "@/lib/streak-calculator";
import { DAILY_BONUS_POINTS } from "@/lib/constants";
import type {
  Chore,
  ChoreAssignment,
  ChoreCompletion,
  Badge,
  UserBadge,
  Streak,
} from "@/lib/types";

/**
 * POST /api/admin/verifications/:id  { action: "approve" | "deny", note?: string }
 *
 * Parent decides on a pending chore_completions row. Approving runs the
 * same streak/badge/bonus recompute as /api/complete-chore.
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
  const { data: completionData } = await admin
    .from("chore_completions")
    .select("*")
    .eq("id", params.id)
    .single();
  const completion = completionData as ChoreCompletion | null;
  if (!completion) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (completion.status !== "pending") {
    return NextResponse.json({ error: "Already decided" }, { status: 400 });
  }

  // Authorization: parent of the kid (or super admin)
  if (!ctx.isSuperAdmin) {
    const ok = await isChildOfFamily(completion.user_id, ctx.familyId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch chore (for family scoping + points + recompute)
  const { data: choreData } = await admin
    .from("chores")
    .select("*")
    .eq("id", completion.chore_id)
    .single();
  const chore = choreData as Chore | null;
  if (!chore) return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  const familyId = chore.family_id;

  // Update status
  const { error: updErr } = await admin
    .from("chore_completions")
    .update({
      status: action === "approve" ? "verified" : "denied",
      verified_by: ctx.user.id,
      verified_at: new Date().toISOString(),
      denial_reason: action === "deny" ? (note?.trim() || null) : completion.denial_reason,
    })
    .eq("id", params.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  if (action !== "approve") {
    return NextResponse.json({ ok: true });
  }

  // ============================================================
  // Approve path — recompute streaks/bonus/badges for this kid
  // ============================================================
  const userId = completion.user_id;
  const completedDate = completion.completed_date;

  const [completionsRes, choresRes, assignmentsRes] = await Promise.all([
    admin.from("chore_completions").select("*").eq("user_id", userId),
    admin.from("chores").select("*").eq("is_active", true).eq("family_id", familyId),
    admin.from("chore_assignments").select("*").eq("user_id", userId),
  ]);

  const completions = (completionsRes.data as ChoreCompletion[] | null) ?? [];
  const allChoresInFamily = (choresRes.data as Chore[] | null) ?? [];
  const assignments = (assignmentsRes.data as ChoreAssignment[] | null) ?? [];

  const assignedIds = new Set(
    assignments.filter((a) => a.removed_at === null).map((a) => a.chore_id),
  );
  const chores = allChoresInFamily.filter((c) => assignedIds.has(c.id));
  const choreAssignment = assignments.find((a) => a.chore_id === chore.id);

  const newChoreStreak = computeChoreStreak(chore, completions, completedDate, choreAssignment);
  const newOverallStreak = computeOverallStreak(chores, completions, completedDate, assignments);

  await admin.from("streaks").upsert(
    {
      user_id: userId,
      chore_id: chore.id,
      current_streak: newChoreStreak,
      longest_streak: newChoreStreak,
      last_completed: completedDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,chore_id" },
  );
  await admin
    .from("streaks")
    .update({ longest_streak: newChoreStreak })
    .eq("user_id", userId)
    .eq("chore_id", chore.id)
    .lt("longest_streak", newChoreStreak);

  const { data: existingOverall } = await admin
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .is("chore_id", null)
    .maybeSingle() as { data: Streak | null; error: unknown };

  await admin.from("streaks").upsert(
    {
      ...(existingOverall ? { id: existingOverall.id } : {}),
      user_id: userId,
      chore_id: null,
      current_streak: newOverallStreak,
      longest_streak: Math.max(newOverallStreak, existingOverall?.longest_streak ?? 0),
      last_completed: completedDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,chore_id" },
  );

  // Daily bonus
  const dayOfWeek = getDayOfWeek(completedDate);
  const todaysChores = getChoresForDay(chores, dayOfWeek);
  const verifiedToday = new Set(
    completions
      .filter((c) => c.completed_date === completedDate && c.status === "verified")
      .map((c) => c.chore_id),
  );
  const allComplete = todaysChores.every((c) => verifiedToday.has(c.id));

  if (allComplete) {
    const { data: existing } = await admin
      .from("daily_bonuses")
      .select("id")
      .eq("user_id", userId)
      .eq("bonus_date", completedDate)
      .maybeSingle();

    if (!existing) {
      await admin.from("daily_bonuses").insert({
        user_id: userId,
        bonus_date: completedDate,
        points_bonus: DAILY_BONUS_POINTS,
        awarded_at: new Date().toISOString(),
      });
    }
  }

  // Badges
  const { data: allBadges } = await admin
    .from("badges")
    .select("*")
    .eq("family_id", familyId) as { data: Badge[] | null; error: unknown };
  const { data: userBadgesData } = await admin
    .from("user_badges")
    .select("*")
    .eq("user_id", userId) as { data: UserBadge[] | null; error: unknown };

  const { newBadges } = checkBadges(
    allBadges ?? [],
    userBadgesData ?? [],
    chores,
    completions,
    completedDate,
    assignments,
  );

  if (newBadges.length > 0) {
    await admin.from("user_badges").insert(
      newBadges.map((b) => ({
        user_id: userId,
        badge_id: b.id,
        earned_at: new Date().toISOString(),
      })),
    );
  }

  return NextResponse.json({ ok: true, newBadges, newOverallStreak, newChoreStreak });
}
