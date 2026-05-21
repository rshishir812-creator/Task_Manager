import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkBadges } from "@/lib/badge-checker";
import {
  computeChoreStreak,
  computeOverallStreak,
  getChoresForDay,
  getDayOfWeek,
  getTodayIST,
} from "@/lib/streak-calculator";
import { DAILY_BONUS_POINTS } from "@/lib/constants";
import type { Chore, ChoreAssignment, ChoreCompletion, Badge, UserBadge, Streak, CompletionStatus } from "@/lib/types";

/** "HH:MM:SS" current IST clock string. */
function currentIstHHMMSS(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(11, 19);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    choreId: string;
    completedDate: string;
    isException?: boolean;
    exceptionReason?: string;
    startAt?: string;     // ISO timestamp — kid's self-reported start
    endAt?: string;       // ISO timestamp — kid's self-reported end
    notes?: string;       // kid's proof text
  };
  const {
    choreId,
    completedDate,
    isException = false,
    exceptionReason,
    startAt,
    endAt,
    notes,
  } = body;

  const adminClient = createAdminClient();

  // Resolve the requester's family
  const { data: profileData } = await adminClient
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single() as { data: { family_id: string } | null; error: unknown };
  if (!profileData) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const familyId = profileData.family_id;

  // Fetch chore (must belong to user's family)
  const { data: chore } = await adminClient
    .from("chores")
    .select("*")
    .eq("id", choreId)
    .eq("family_id", familyId)
    .single() as { data: Chore | null; error: unknown };

  if (!chore) return NextResponse.json({ error: "Chore not found" }, { status: 404 });

  // Verify this chore is currently assigned to the requester
  const { data: assignment } = await adminClient
    .from("chore_assignments")
    .select("chore_id, removed_at")
    .eq("chore_id", choreId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!assignment || (assignment as { removed_at: string | null }).removed_at !== null) {
    return NextResponse.json({ error: "Not assigned" }, { status: 403 });
  }

  // ============================================================
  // Verification gates (Phase 5a)
  // ============================================================

  // 1. Time window — only enforced for today's submission (admin calendar edits bypass)
  const today = getTodayIST();
  if (
    chore.window_start_time &&
    chore.window_end_time &&
    completedDate === today
  ) {
    const nowHHMMSS = currentIstHHMMSS();
    if (nowHHMMSS < chore.window_start_time || nowHHMMSS > chore.window_end_time) {
      return NextResponse.json(
        {
          error: `This chore can only be done between ${chore.window_start_time.slice(0, 5)} and ${chore.window_end_time.slice(0, 5)} IST.`,
        },
        { status: 400 },
      );
    }
  }

  // 2. Self-report check — start, end, notes required when chore demands them
  let selfReportStart: string | null = null;
  let selfReportEnd: string | null = null;
  let cleanedNotes: string | null = null;

  if (chore.requires_self_report && !isException) {
    if (!startAt || !endAt) {
      return NextResponse.json(
        { error: "Please fill in when you started and ended." },
        { status: 400 },
      );
    }
    const s = new Date(startAt);
    const e = new Date(endAt);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      return NextResponse.json({ error: "Invalid start/end time" }, { status: 400 });
    }
    if (e <= s) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 },
      );
    }
    const trimmed = (notes ?? "").trim();
    if (trimmed.length < 5) {
      return NextResponse.json(
        { error: "Add a short note about what you did (5+ chars)." },
        { status: 400 },
      );
    }
    selfReportStart = s.toISOString();
    selfReportEnd = e.toISOString();
    cleanedNotes = trimmed;
  } else if (notes && notes.trim().length > 0) {
    // Notes are allowed even when not required
    cleanedNotes = notes.trim();
  }

  // 3. Final status
  const requiresApproval = chore.requires_parent_approval || chore.requires_self_report;
  const status: CompletionStatus = requiresApproval ? "pending" : "verified";
  const pointsEarned = isException ? 0 : chore.points;

  // Upsert completion
  const nowIso = new Date().toISOString();
  const { error: insertErr } = await adminClient
    .from("chore_completions")
    .upsert(
      {
        chore_id: choreId,
        user_id: user.id,
        completed_date: completedDate,
        is_exception: isException,
        exception_reason: exceptionReason ?? null,
        completed_at: nowIso,
        points_earned: pointsEarned,
        status,
        verified_by: status === "verified" ? user.id : null,
        verified_at: status === "verified" ? nowIso : null,
        denial_reason: null,
        self_report_start_at: selfReportStart,
        self_report_end_at: selfReportEnd,
        notes: cleanedNotes,
      },
      { onConflict: "chore_id,user_id,completed_date" },
    );

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // ============================================================
  // Recompute streaks/badges/bonus (only verified completions count)
  // ============================================================
  const [completionsRes, choresRes, assignmentsRes] = await Promise.all([
    adminClient.from("chore_completions").select("*").eq("user_id", user.id),
    adminClient.from("chores").select("*").eq("is_active", true).eq("family_id", familyId),
    adminClient.from("chore_assignments").select("*").eq("user_id", user.id),
  ]);

  const completions = (completionsRes.data as ChoreCompletion[] | null) ?? [];
  const allChoresInFamily = (choresRes.data as Chore[] | null) ?? [];
  const assignments = (assignmentsRes.data as ChoreAssignment[] | null) ?? [];

  const assignedIds = new Set(
    assignments.filter((a) => a.removed_at === null).map((a) => a.chore_id),
  );
  const chores = allChoresInFamily.filter((c) => assignedIds.has(c.id));
  const choreAssignment = assignments.find((a) => a.chore_id === choreId);

  const newChoreStreak = computeChoreStreak(chore, completions, completedDate, choreAssignment);
  const newOverallStreak = computeOverallStreak(chores, completions, completedDate, assignments);

  await adminClient.from("streaks").upsert(
    {
      user_id: user.id,
      chore_id: choreId,
      current_streak: newChoreStreak,
      longest_streak: newChoreStreak,
      last_completed: completedDate,
      updated_at: nowIso,
    },
    { onConflict: "user_id,chore_id" },
  );

  await adminClient
    .from("streaks")
    .update({ longest_streak: newChoreStreak })
    .eq("user_id", user.id)
    .eq("chore_id", choreId)
    .lt("longest_streak", newChoreStreak);

  const { data: existingOverall } = await adminClient
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .is("chore_id", null)
    .maybeSingle() as { data: Streak | null; error: unknown };

  await adminClient.from("streaks").upsert(
    {
      ...(existingOverall ? { id: existingOverall.id } : {}),
      user_id: user.id,
      chore_id: null,
      current_streak: newOverallStreak,
      longest_streak: Math.max(newOverallStreak, existingOverall?.longest_streak ?? 0),
      last_completed: completedDate,
      updated_at: nowIso,
    },
    { onConflict: "user_id,chore_id" },
  );

  // Daily bonus only if ALL scheduled chores today are VERIFIED
  const dayOfWeek = getDayOfWeek(completedDate);
  const todaysChores = getChoresForDay(chores, dayOfWeek);
  const verifiedToday = new Set(
    completions
      .filter((c) => c.completed_date === completedDate && c.status === "verified")
      .map((c) => c.chore_id),
  );
  const allComplete = todaysChores.every((c) => verifiedToday.has(c.id));

  let dailyBonusAwarded = false;
  if (allComplete) {
    const { data: existing } = await adminClient
      .from("daily_bonuses")
      .select("id")
      .eq("user_id", user.id)
      .eq("bonus_date", completedDate)
      .maybeSingle();

    if (!existing) {
      await adminClient.from("daily_bonuses").insert({
        user_id: user.id,
        bonus_date: completedDate,
        points_bonus: DAILY_BONUS_POINTS,
        awarded_at: nowIso,
      });
      dailyBonusAwarded = true;
    }
  }

  // Badges
  const { data: allBadges } = await adminClient
    .from("badges")
    .select("*")
    .eq("family_id", familyId) as { data: Badge[] | null; error: unknown };

  const { data: userBadgesData } = await adminClient
    .from("user_badges")
    .select("*")
    .eq("user_id", user.id) as { data: UserBadge[] | null; error: unknown };

  const { newBadges } = checkBadges(
    allBadges ?? [],
    userBadgesData ?? [],
    chores,
    completions,
    completedDate,
    assignments,
  );

  if (newBadges.length > 0) {
    await adminClient.from("user_badges").insert(
      newBadges.map((b) => ({
        user_id: user.id,
        badge_id: b.id,
        earned_at: new Date().toISOString(),
      })),
    );
  }

  return NextResponse.json({
    pointsEarned: status === "verified" ? pointsEarned : 0,
    newChoreStreak,
    newOverallStreak,
    badgesAwarded: status === "verified" ? newBadges : [],
    dailyBonusAwarded,
    allComplete,
    status,
  });
}
