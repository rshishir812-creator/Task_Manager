import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTodayIST, getDayOfWeek, getChoresForDay, computeOverallStreak } from "@/lib/streak-calculator";
import { getLevelInfo } from "@/lib/points-calculator";
import UserMirror from "@/components/admin/UserMirror";
import StreakFlame from "@/components/gamification/StreakFlame";
import Link from "next/link";
import type { Profile, Chore, ChoreCompletion, DailyBonus, UserBadge, Streak } from "@/lib/types";

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  // Get Ridham's profile (the user)
  const { data: profilesData } = await adminClient
    .from("profiles")
    .select("*");

  const profiles = (profilesData as Profile[] | null) ?? [];
  const ridham = profiles.find((p) => p.role === "user");

  const today = getTodayIST();
  const todayDow = getDayOfWeek(today);

  if (!ridham) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-fg">Admin Overview</h1>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-8 text-center">
          <p className="text-fg-muted">No user account found yet. Ridham hasn&apos;t logged in.</p>
        </div>
      </div>
    );
  }

  const [
    { data: choresData },
    { data: completionsData },
    { data: streaksData },
    { data: bonusesData },
    { data: userBadgesData },
  ] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", ridham.id),
    adminClient.from("streaks").select("*").eq("user_id", ridham.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", ridham.id),
    adminClient.from("user_badges").select("*").eq("user_id", ridham.id),
  ]);

  const chores = (choresData as Chore[] | null) ?? [];
  const completions = (completionsData as ChoreCompletion[] | null) ?? [];
  const streaks = (streaksData as Streak[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];

  const todaysChores = getChoresForDay(chores, todayDow);

  const totalPoints =
    completions.reduce((s, c) => s + (c.points_earned ?? 0), 0) +
    bonuses.reduce((s, b) => s + b.points_bonus, 0);

  const overallStreak = computeOverallStreak(chores, completions, today);
  const longestStreak = streaks.find((s) => s.chore_id === null)?.longest_streak ?? 0;
  const levelInfo = getLevelInfo(totalPoints);

  const todayCompletedCount = new Set(
    completions.filter((c) => c.completed_date === today).map((c) => c.chore_id)
  ).size;
  const todayPct =
    todaysChores.length > 0
      ? Math.round((todayCompletedCount / todaysChores.length) * 100)
      : 0;

  const quickLinks = [
    { href: "/admin/chores", icon: "⚔️", label: "Manage Chores" },
    { href: "/admin/badges", icon: "🏅", label: "Manage Badges" },
    { href: "/admin/calendar", icon: "📅", label: "Calendar View" },
    { href: "/admin/points", icon: "💰", label: "Points Override" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Overview</h1>
        <p className="text-sm text-fg-muted mt-1">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Ridham's stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
          <p className="font-display font-bold text-2xl text-accent-amber">{totalPoints.toLocaleString()}</p>
          <p className="text-xs text-fg-muted mt-1">Total XP</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
          <p className="font-display font-bold text-2xl text-accent-teal">Lv.{levelInfo.level}</p>
          <p className="text-xs text-fg-muted mt-1">{levelInfo.name}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex flex-col items-center justify-center gap-1">
          <StreakFlame streak={overallStreak} size="md" />
          <p className="text-xs text-fg-muted">Current streak</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
          <p className="font-display font-bold text-2xl text-fg">{todayPct}%</p>
          <p className="text-xs text-fg-muted mt-1">Done today</p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
          <p className="font-display font-bold text-xl text-fg">{longestStreak}</p>
          <p className="text-xs text-fg-muted mt-1">Longest streak 🏆</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
          <p className="font-display font-bold text-xl text-fg">{userBadges.length}</p>
          <p className="text-xs text-fg-muted mt-1">Badges earned 🏅</p>
        </div>
      </div>

      {/* Today's mirror */}
      <UserMirror
        todaysChores={todaysChores}
        completions={completions}
        streaks={streaks}
        today={today}
        userName={ridham.name?.split(" ")[0] ?? "Ridham"}
      />

      {/* Quick links */}
      <div>
        <h2 className="font-display font-semibold text-fg mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex items-center gap-3 hover:border-accent-amber hover:bg-accent-amber/5 transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {link.icon}
              </span>
              <span className="font-display font-semibold text-sm text-fg">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
