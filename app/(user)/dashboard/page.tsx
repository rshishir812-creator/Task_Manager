import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getChoresForDay, getDayOfWeek, getTodayIST, getYesterdayIST, computeOverallStreak } from "@/lib/streak-calculator";
import { computeMilestones } from "@/lib/milestone-calculator";
import { getAssignmentsForUser } from "@/lib/auth-scope";
import { ensureActiveChallenges } from "@/lib/challenge-server";
import { computeChallengeProgress } from "@/lib/challenge-engine";
import { expandHolidaysToSet } from "@/lib/holidays";
import { sumChallengeXp } from "@/lib/xp";
import DashboardClient from "@/components/chores/DashboardClient";
import type { QuestView } from "@/components/gamification/WeeklyQuestCard";
import type { Chore, ChoreCompletion, Streak, DailyBonus, Profile, Badge, UserBadge, ChallengeClaim, Holiday } from "@/lib/types";

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
    { data: claimsData },
    { data: holidaysData },
    assignments,
  ] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).eq("family_id", profile.family_id).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", user.id),
    adminClient.from("streaks").select("*").eq("user_id", user.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", user.id),
    adminClient.from("badges").select("*").eq("family_id", profile.family_id),
    adminClient.from("user_badges").select("*").eq("user_id", user.id),
    adminClient.from("challenge_claims").select("*").eq("user_id", user.id),
    adminClient.from("holidays").select("*").eq("user_id", user.id),
    getAssignmentsForUser(user.id),
  ]);

  const allChores = (choresData as Chore[] | null) ?? [];
  // Currently-active assignment ids (removed_at === null)
  const assignedIds = new Set(
    assignments.filter((a) => a.removed_at === null).map((a) => a.chore_id),
  );
  const chores = allChores.filter((c) => assignedIds.has(c.id));
  const allCompletions = (completionsData as ChoreCompletion[] | null) ?? [];
  const streaks = (streaksData as Streak[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];
  const badges = (badgesData as Badge[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];
  const claims = (claimsData as ChallengeClaim[] | null) ?? [];
  const holidayRows = (holidaysData as Holiday[] | null) ?? [];
  const holidays = expandHolidaysToSet(holidayRows);

  const today = getTodayIST();
  const todayDow = getDayOfWeek(today);
  const todaysChores = getChoresForDay(chores, todayDow);
  const todayCompletions = allCompletions.filter((c) => c.completed_date === today);

  const yesterday = getYesterdayIST(today);
  const yesterdayDow = getDayOfWeek(yesterday);
  const yesterdaysChores = getChoresForDay(chores, yesterdayDow);
  const yesterdayCompletions = allCompletions.filter((c) => c.completed_date === yesterday);

  // Holiday state for the two viewable days (today / yesterday).
  const findHoliday = (d: string) => holidayRows.find((h) => d >= h.start_date && d <= h.end_date) ?? null;
  const todayHoliday = holidays.has(today) ? findHoliday(today) : null;
  const yesterdayHoliday = holidays.has(yesterday) ? findHoliday(yesterday) : null;

  // Calculate total points: sum of all completions + daily bonuses + quest rewards
  const totalPoints =
    allCompletions.reduce((sum, c) => sum + (c.points_earned ?? 0), 0) +
    bonuses.reduce((sum, b) => sum + b.points_bonus, 0) +
    sumChallengeXp(claims);

  const overallStreak = computeOverallStreak(chores, allCompletions, today, assignments, holidays);

  // Weekly Quest — ensure this week's quest exists, compute progress for the card.
  const activeChallenges = await ensureActiveChallenges(profile.family_id, today);
  const claimedIds = new Set(claims.map((c) => c.challenge_id));
  const activeChallenge = activeChallenges[0] ?? null;
  let quest: QuestView | null = null;
  if (activeChallenge) {
    const progress = computeChallengeProgress(activeChallenge, {
      completions: allCompletions,
      dailyBonuses: bonuses,
    });
    const claimed = claimedIds.has(activeChallenge.id);
    const msLeft = new Date(`${activeChallenge.period_end}T23:59:59Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime();
    quest = {
      title: activeChallenge.title,
      description: activeChallenge.description,
      icon: activeChallenge.icon,
      current: progress.current,
      target: progress.target,
      rewardPoints: activeChallenge.reward_points,
      complete: progress.complete,
      claimed,
      daysLeft: Math.max(0, Math.round(msLeft / (24 * 60 * 60 * 1000))),
    };
  }

  const milestones = computeMilestones({
    badges,
    userBadges,
    chores,
    completions: allCompletions,
    today,
    assignments,
    extras: { totalXp: totalPoints, questsCompleted: claims.length },
    holidays,
  }).slice(0, 3);

  const holidayLabel = (h: Holiday | null) =>
    h ? { reason: h.reason, note: h.note } : null;

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
      quest={quest}
      todayHoliday={holidayLabel(todayHoliday)}
      yesterdayHoliday={holidayLabel(yesterdayHoliday)}
    />
  );
}
