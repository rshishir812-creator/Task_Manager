import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLevelInfo } from "@/lib/points-calculator";
import {
  getTodayIST,
  getDayOfWeek,
  computeOverallStreak,
  onlyVerified,
} from "@/lib/streak-calculator";
import { getAssignedChoreIds, getAssignmentsForUser, getChildrenOfFamily } from "@/lib/auth-scope";
import {
  computePersonalRecords,
  generateHeroVibeLine,
  pointsThisWeek,
  computeTimeOfDayBuckets,
  computeWeeklyRecap,
  isRecapDay,
  computeSiblingCup,
} from "@/lib/insights";
import { computeMilestones } from "@/lib/milestone-calculator";
import { sumChallengeXp } from "@/lib/xp";
import { getHolidaySetsForFamily } from "@/lib/holidays";
import HeroBanner from "@/components/stats/HeroBanner";
import PersonalRecordsWall from "@/components/stats/PersonalRecordsWall";
import UpNextBadges from "@/components/stats/UpNextBadges";
import WeeklyRecapCard from "@/components/stats/WeeklyRecapCard";
import TimeOfDayChart from "@/components/stats/TimeOfDayChart";
import StreakGalaxy from "@/components/stats/StreakGalaxy";
import SiblingCup from "@/components/stats/SiblingCup";
import StreakFlame from "@/components/gamification/StreakFlame";
import type {
  Chore,
  ChoreAssignment,
  ChoreCompletion,
  Streak,
  DailyBonus,
  Profile,
  Badge,
  UserBadge,
  ChallengeClaim,
} from "@/lib/types";

export default async function StatsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const { data: profileData } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
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
    assignedIds,
    assignments,
    allKids,
  ] = await Promise.all([
    adminClient
      .from("chores")
      .select("*")
      .eq("is_active", true)
      .eq("family_id", profile.family_id)
      .order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", user.id),
    adminClient.from("streaks").select("*").eq("user_id", user.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", user.id),
    adminClient.from("badges").select("*").eq("family_id", profile.family_id),
    adminClient.from("user_badges").select("*").eq("user_id", user.id),
    adminClient.from("challenge_claims").select("*").eq("user_id", user.id),
    getAssignedChoreIds(user.id),
    getAssignmentsForUser(user.id),
    getChildrenOfFamily(profile.family_id),
  ]);

  const allChores = (choresData as Chore[] | null) ?? [];
  const chores = allChores.filter((c) => assignedIds.has(c.id));
  const completions = (completionsData as ChoreCompletion[] | null) ?? [];
  const streaks = (streaksData as Streak[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];
  const badges = (badgesData as Badge[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];
  const claims = (claimsData as ChallengeClaim[] | null) ?? [];

  const today = getTodayIST();
  const todayDow = getDayOfWeek(today);

  const totalPoints =
    completions.reduce((s, c) => s + (c.points_earned ?? 0), 0) +
    bonuses.reduce((s, b) => s + b.points_bonus, 0) +
    sumChallengeXp(claims);

  const familyHolidays = await getHolidaySetsForFamily(profile.family_id);
  const holidays = familyHolidays.get(user.id) ?? new Set<string>();

  const levelInfo = getLevelInfo(totalPoints);
  const records = computePersonalRecords(completions, streaks, today);
  const timeBuckets = computeTimeOfDayBuckets(completions);

  const milestones = computeMilestones({
    badges,
    userBadges,
    chores,
    completions,
    today,
    assignments,
    extras: { totalXp: totalPoints, questsCompleted: claims.length },
    holidays,
  });

  const todaysChores = chores.filter((c) => c.recurrence.includes(todayDow));
  const todayCompletedIds = new Set(
    onlyVerified(completions)
      .filter((c) => c.completed_date === today)
      .map((c) => c.chore_id),
  );
  const todayCompletedCount = todaysChores.filter((c) =>
    todayCompletedIds.has(c.id),
  ).length;

  const currentOverallStreak = computeOverallStreak(
    chores,
    completions,
    today,
    assignments,
    holidays,
  );

  const vibeLine = generateHeroVibeLine({
    currentOverallStreak,
    nearestMilestone: milestones[0]
      ? { distance: milestones[0].distance, badgeTitle: milestones[0].badge.title }
      : undefined,
    thisWeekPoints: pointsThisWeek(completions, today),
    bestWeekPoints: records.bestWeek.value,
    todayCompletedCount,
    todayScheduledCount: todaysChores.length,
  });

  // Weekly recap (Sundays only)
  const weeklyRecap = isRecapDay(today)
    ? computeWeeklyRecap(completions, chores, assignments, badges, userBadges, today, holidays)
    : null;

  // Sibling Cup — fetch siblings' data only if family has 2+ kids
  let siblingCupEntries: Awaited<ReturnType<typeof computeSiblingCup>> = null;
  if (allKids.length >= 2) {
    const siblingsData = await Promise.all(
      allKids
        .filter((k) => k.id !== user.id)
        .map((sib) =>
          Promise.all([
            adminClient.from("chore_completions").select("*").eq("user_id", sib.id),
            adminClient.from("chore_assignments").select("*").eq("user_id", sib.id),
          ]).then(([comps, assigns]) => {
            const sibAssignments = (assigns.data as ChoreAssignment[] | null) ?? [];
            const sibAssignedIds = new Set(sibAssignments.map((a) => a.chore_id));
            return {
              profile: sib,
              completions: (comps.data as ChoreCompletion[] | null) ?? [],
              chores: allChores.filter((c) => sibAssignedIds.has(c.id)),
              assignments: sibAssignments,
              holidays: familyHolidays.get(sib.id) ?? new Set<string>(),
            };
          }),
        ),
    );

    const meData = {
      profile,
      completions,
      chores,
      assignments,
      holidays,
    };
    siblingCupEntries = computeSiblingCup([meData, ...siblingsData], today);
  }

  const overallStreak = streaks.find((s) => s.chore_id === null);
  const choreStreaksSorted = [...streaks]
    .filter((s) => s.chore_id !== null && s.current_streak > 0)
    .sort((a, b) => b.current_streak - a.current_streak);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl text-fg">Quest Log 📜</h1>

      <HeroBanner
        totalPoints={totalPoints}
        vibeLine={vibeLine}
        level={levelInfo.level}
      />

      {weeklyRecap && <WeeklyRecapCard recap={weeklyRecap} />}

      <PersonalRecordsWall records={records} />

      <UpNextBadges milestones={milestones} />

      <StreakGalaxy streaks={streaks} chores={chores} />

      <TimeOfDayChart buckets={timeBuckets} />

      {siblingCupEntries && <SiblingCup entries={siblingCupEntries} />}

      {/* Overall streak detail */}
      {overallStreak && overallStreak.current_streak > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-5 flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-fg">Daily Streak</p>
            <p className="text-xs text-fg-muted mt-0.5">
              Longest: {overallStreak.longest_streak} days
            </p>
          </div>
          <StreakFlame streak={overallStreak.current_streak} size="lg" />
        </div>
      )}

      {/* Per-chore active streaks — show only if not shown in Galaxy */}
      {choreStreaksSorted.length > 0 && choreStreaksSorted.length <= 2 && (
        <div>
          <h2 className="font-display font-semibold text-fg mb-3">🏅 Active Chore Streaks</h2>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
            {choreStreaksSorted.map((s, i) => {
              const chore = chores.find((c) => c.id === s.chore_id);
              if (!chore) return null;
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i > 0 ? "border-t border-[var(--border)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{chore.icon ?? "✅"}</span>
                    <div>
                      <p className="text-sm font-semibold text-fg">{chore.title}</p>
                      <p className="text-xs text-fg-muted">Best: {s.longest_streak} days</p>
                    </div>
                  </div>
                  <StreakFlame streak={s.current_streak} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Total chores done */}
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
        <p className="font-display font-bold text-3xl text-fg">
          {onlyVerified(completions).length}
        </p>
        <p className="text-sm text-fg-muted mt-1">Total chores conquered 🎯</p>
      </div>
    </div>
  );
}
