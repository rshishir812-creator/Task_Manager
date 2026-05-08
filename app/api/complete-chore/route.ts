import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkBadges } from "@/lib/badge-checker";
import { computeChoreStreak, computeOverallStreak, getChoresForDay, getDayOfWeek } from "@/lib/streak-calculator";
import { DAILY_BONUS_POINTS } from "@/lib/constants";
import type { Chore, ChoreCompletion, Badge, UserBadge, Streak } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    choreId: string;
    completedDate: string;
    isException?: boolean;
    exceptionReason?: string;
  };
  const { choreId, completedDate, isException = false, exceptionReason } = body;

  const adminClient = createAdminClient();

  // Fetch chore for points
  const { data: chore } = await adminClient
    .from("chores")
    .select("*")
    .eq("id", choreId)
    .single() as { data: Chore | null; error: unknown };

  if (!chore) return NextResponse.json({ error: "Chore not found" }, { status: 404 });

  const pointsEarned = isException ? 0 : chore.points;

  // Upsert completion (idempotent)
  const { error: insertErr } = await adminClient
    .from("chore_completions")
    .upsert(
      {
        chore_id: choreId,
        user_id: user.id,
        completed_date: completedDate,
        is_exception: isException,
        exception_reason: exceptionReason ?? null,
        completed_at: new Date().toISOString(),
        points_earned: pointsEarned,
      },
      { onConflict: "chore_id,user_id,completed_date" }
    );

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Fetch all completions for streak / badge calc
  const { data: allCompletions } = await adminClient
    .from("chore_completions")
    .select("*")
    .eq("user_id", user.id) as { data: ChoreCompletion[] | null; error: unknown };

  const { data: allChores } = await adminClient
    .from("chores")
    .select("*")
    .eq("is_active", true) as { data: Chore[] | null; error: unknown };

  const completions = allCompletions ?? [];
  const chores = allChores ?? [];

  // Recompute streaks
  const newChoreStreak = computeChoreStreak(chore, completions, completedDate);
  const newOverallStreak = computeOverallStreak(chores, completions, completedDate);

  // Upsert per-chore streak
  await adminClient.from("streaks").upsert(
    {
      user_id: user.id,
      chore_id: choreId,
      current_streak: newChoreStreak,
      longest_streak: newChoreStreak, // will be updated below
      last_completed: completedDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,chore_id" }
  );

  // Ensure longest_streak is never decreased
  await adminClient
    .from("streaks")
    .update({ longest_streak: newChoreStreak })
    .eq("user_id", user.id)
    .eq("chore_id", choreId)
    .lt("longest_streak", newChoreStreak);

  // Upsert overall streak (chore_id IS NULL)
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,chore_id" }
  );

  // Check if all chores for the day are done → daily bonus
  const dayOfWeek = getDayOfWeek(completedDate);
  const todaysChores = getChoresForDay(chores, dayOfWeek);
  const completedToday = new Set(
    completions
      .filter((c) => c.completed_date === completedDate)
      .map((c) => c.chore_id)
  );
  const allComplete = todaysChores.every((c) => completedToday.has(c.id));

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
        awarded_at: new Date().toISOString(),
      });
      dailyBonusAwarded = true;
    }
  }

  // Check badges
  const { data: allBadges } = await adminClient
    .from("badges")
    .select("*") as { data: Badge[] | null; error: unknown };

  const { data: userBadgesData } = await adminClient
    .from("user_badges")
    .select("*")
    .eq("user_id", user.id) as { data: UserBadge[] | null; error: unknown };

  const { newBadges } = checkBadges(
    allBadges ?? [],
    userBadgesData ?? [],
    chores,
    completions,
    completedDate
  );

  if (newBadges.length > 0) {
    await adminClient.from("user_badges").insert(
      newBadges.map((b) => ({
        user_id: user.id,
        badge_id: b.id,
        earned_at: new Date().toISOString(),
      }))
    );
  }

  return NextResponse.json({
    pointsEarned,
    newChoreStreak,
    newOverallStreak,
    badgesAwarded: newBadges,
    dailyBonusAwarded,
    allComplete,
  });
}
