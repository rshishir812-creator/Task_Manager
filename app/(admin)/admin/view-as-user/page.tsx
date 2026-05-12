import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getChoresForDay, getDayOfWeek, getTodayIST, computeOverallStreak } from "@/lib/streak-calculator";
import { computeMilestones } from "@/lib/milestone-calculator";
import DashboardClient from "@/components/chores/DashboardClient";
import type { Chore, ChoreCompletion, Streak, DailyBonus, Profile, Badge, UserBadge } from "@/lib/types";
import Link from "next/link";

export default async function ViewAsUserPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const { data: adminProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") redirect("/dashboard");

  const { data: ridhamProfile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("role", "user")
    .single() as { data: Profile | null; error: unknown };

  if (!ridhamProfile) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/dashboard" className="text-sm text-fg-muted hover:text-fg">← Back to admin</Link>
        <p className="text-fg-muted">Ridham hasn&apos;t logged in yet — no profile found.</p>
      </div>
    );
  }

  const [
    { data: choresData },
    { data: completionsData },
    { data: streaksData },
    { data: bonusesData },
    { data: badgesData },
    { data: userBadgesData },
  ] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", ridhamProfile.id),
    adminClient.from("streaks").select("*").eq("user_id", ridhamProfile.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", ridhamProfile.id),
    adminClient.from("badges").select("*"),
    adminClient.from("user_badges").select("*").eq("user_id", ridhamProfile.id),
  ]);

  const chores = (choresData as Chore[] | null) ?? [];
  const allCompletions = (completionsData as ChoreCompletion[] | null) ?? [];
  const streaks = (streaksData as Streak[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];
  const badges = (badgesData as Badge[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];

  const today = getTodayIST();
  const todayDow = getDayOfWeek(today);
  const todaysChores = getChoresForDay(chores, todayDow);
  const todayCompletions = allCompletions.filter((c) => c.completed_date === today);

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/dashboard"
          className="text-sm text-fg-muted hover:text-fg transition-colors"
        >
          ← Back to admin
        </Link>
        <span className="text-xs bg-accent-amber/20 text-accent-amber px-2 py-1 rounded-full font-semibold">
          Viewing as {ridhamProfile.name?.split(" ")[0] ?? "Ridham"}
        </span>
      </div>

      <DashboardClient
        profile={ridhamProfile}
        todaysChores={todaysChores}
        initialCompletions={todayCompletions}
        streaks={streaks}
        totalPoints={totalPoints}
        today={today}
        overallStreak={overallStreak}
        milestones={milestones}
      />
    </div>
  );
}
