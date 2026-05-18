import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getChoresForDay, getDayOfWeek, getTodayIST, getYesterdayIST, computeOverallStreak } from "@/lib/streak-calculator";
import { computeMilestones } from "@/lib/milestone-calculator";
import { getAssignedChoreIds } from "@/lib/auth-scope";
import DashboardClient from "@/components/chores/DashboardClient";
import type { Chore, ChoreCompletion, Streak, DailyBonus, Profile, Badge, UserBadge } from "@/lib/types";

export default async function UserDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  // Get profile first so we know the family_id for chore + badge scoping
  const { data: profileData } = await adminClient
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as Profile | null;
  if (!profile) redirect("/login");

  const [
    { data: choresData },
    { data: completionsData },
    { data: streaksData },
    { data: bonusesData },
    { data: badgesData },
    { data: userBadgesData },
    assignedIds,
  ] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).eq("family_id", profile.family_id).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", user.id),
    adminClient.from("streaks").select("*").eq("user_id", user.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", user.id),
    adminClient.from("badges").select("*").eq("family_id", profile.family_id),
    adminClient.from("user_badges").select("*").eq("user_id", user.id),
    getAssignedChoreIds(user.id),
  ]);

  const allChores = (choresData as Chore[] | null) ?? [];
  const chores = allChores.filter((c) => assignedIds.has(c.id));
  const allCompletions = (completionsData as ChoreCompletion[] | null) ?? [];
  const streaks = (streaksData as Streak[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];
  const badges = (badgesData as Badge[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];

  const today = getTodayIST();
  const todayDow = getDayOfWeek(today);
  const todaysChores = getChoresForDay(chores, todayDow);
  const todayCompletions = allCompletions.filter((c) => c.completed_date === today);

  const yesterday = getYesterdayIST(today);
  const yesterdayDow = getDayOfWeek(yesterday);
  const yesterdaysChores = getChoresForDay(chores, yesterdayDow);
  const yesterdayCompletions = allCompletions.filter((c) => c.completed_date === yesterday);

  // Calculate total points: sum of all completions + daily bonuses
  const totalPoints =
    allCompletions.reduce((sum, c) => sum + (c.points_earned ?? 0), 0) +
    bonuses.reduce((sum, b) => sum + b.points_bonus, 0);

  const overallStreak = computeOverallStreak(chores, allCompletions, today);

  const milestones = computeMilestones({
    badges,
    userBadges,
    chores,
    completions: allCompletions,
    today,
  }).slice(0, 3);

  return (
    <DashboardClient
      profile={profile}
      todaysChores={todaysChores}
      initialCompletions={todayCompletions}
      yesterday={yesterday}
      yesterdaysChores={yesterdaysChores}
      yesterdayCompletions={yesterdayCompletions}
      streaks={streaks}
      totalPoints={totalPoints}
      today={today}
      overallStreak={overallStreak}
      milestones={milestones}
    />
  );
}
