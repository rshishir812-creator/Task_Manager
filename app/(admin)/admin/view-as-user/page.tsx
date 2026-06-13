import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getChoresForDay, getDayOfWeek, getTodayIST, getYesterdayIST, computeOverallStreak } from "@/lib/streak-calculator";
import { computeMilestones } from "@/lib/milestone-calculator";
import { getParentContext, resolveChild, getChildrenOfFamily, getAssignmentsForUser } from "@/lib/auth-scope";
import { ensureActiveChallenges } from "@/lib/challenge-server";
import { computeChallengeProgress } from "@/lib/challenge-engine";
import { sumChallengeXp } from "@/lib/xp";
import ChildPicker from "@/components/admin/ChildPicker";
import DashboardClient from "@/components/chores/DashboardClient";
import type { QuestView } from "@/components/gamification/WeeklyQuestCard";
import type { Chore, ChoreCompletion, Streak, DailyBonus, Badge, UserBadge, ChallengeClaim } from "@/lib/types";
import Link from "next/link";

export default async function ViewAsUserPage({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const adminClient = createAdminClient();
  const [ridhamProfile, allChildren] = await Promise.all([
    resolveChild(ctx.familyId, searchParams, ctx.isSuperAdmin),
    getChildrenOfFamily(ctx.familyId),
  ]);

  if (!ridhamProfile) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/dashboard" className="text-sm text-fg-muted hover:text-fg">← Back to admin</Link>
        <p className="text-fg-muted">No children in your family yet. <Link href="/admin/family" className="text-accent-amber">Add a child →</Link></p>
      </div>
    );
  }

  // Scope chores + badges to that child's family (which equals the parent's family in normal flow;
  // for super admins viewing another family, it's that family's id)
  const childFamilyId = ridhamProfile.family_id;

  const [
    { data: choresData },
    { data: completionsData },
    { data: streaksData },
    { data: bonusesData },
    { data: badgesData },
    { data: userBadgesData },
    { data: claimsData },
    assignments,
  ] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).eq("family_id", childFamilyId).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", ridhamProfile.id),
    adminClient.from("streaks").select("*").eq("user_id", ridhamProfile.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", ridhamProfile.id),
    adminClient.from("badges").select("*").eq("family_id", childFamilyId),
    adminClient.from("user_badges").select("*").eq("user_id", ridhamProfile.id),
    adminClient.from("challenge_claims").select("*").eq("user_id", ridhamProfile.id),
    getAssignmentsForUser(ridhamProfile.id),
  ]);

  const allChores = (choresData as Chore[] | null) ?? [];
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

  const today = getTodayIST();
  const todayDow = getDayOfWeek(today);
  const todaysChores = getChoresForDay(chores, todayDow);
  const todayCompletions = allCompletions.filter((c) => c.completed_date === today);

  const yesterday = getYesterdayIST(today);
  const yesterdayDow = getDayOfWeek(yesterday);
  const yesterdaysChores = getChoresForDay(chores, yesterdayDow);
  const yesterdayCompletions = allCompletions.filter((c) => c.completed_date === yesterday);

  const totalPoints =
    allCompletions.reduce((sum, c) => sum + (c.points_earned ?? 0), 0) +
    bonuses.reduce((sum, b) => sum + b.points_bonus, 0) +
    sumChallengeXp(claims);

  const overallStreak = computeOverallStreak(chores, allCompletions, today, assignments);

  const milestones = computeMilestones({
    badges,
    userBadges,
    chores,
    completions: allCompletions,
    today,
    assignments,
    extras: { totalXp: totalPoints, questsCompleted: claims.length },
  }).slice(0, 3);

  // Weekly Quest mirror for the admin "view as" screen.
  const activeChallenges = await ensureActiveChallenges(childFamilyId, today);
  const claimedIds = new Set(claims.map((c) => c.challenge_id));
  const activeChallenge = activeChallenges[0] ?? null;
  let quest: QuestView | null = null;
  if (activeChallenge) {
    const progress = computeChallengeProgress(activeChallenge, {
      completions: allCompletions,
      dailyBonuses: bonuses,
    });
    const msLeft = new Date(`${activeChallenge.period_end}T23:59:59Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime();
    quest = {
      title: activeChallenge.title,
      description: activeChallenge.description,
      icon: activeChallenge.icon,
      current: progress.current,
      target: progress.target,
      rewardPoints: activeChallenge.reward_points,
      complete: progress.complete,
      claimed: claimedIds.has(activeChallenge.id),
      daysLeft: Math.max(0, Math.round(msLeft / (24 * 60 * 60 * 1000))),
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/dashboard"
          className="text-sm text-fg-muted hover:text-fg transition-colors"
        >
          ← Back to admin
        </Link>
        <span className="text-xs bg-accent-amber/20 text-accent-amber px-2 py-1 rounded-full font-semibold">
          Viewing as {ridhamProfile.name?.split(" ")[0] ?? "child"}
        </span>
      </div>

      <ChildPicker kids={allChildren} currentChildId={ridhamProfile.id} />

      <DashboardClient
        profile={ridhamProfile}
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
      />
    </div>
  );
}
