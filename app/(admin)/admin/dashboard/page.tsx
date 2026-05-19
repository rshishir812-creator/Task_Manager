import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getTodayIST, getDayOfWeek, getChoresForDay, computeOverallStreak } from "@/lib/streak-calculator";
import { getLevelInfo } from "@/lib/points-calculator";
import { getParentContext, resolveChild, getChildrenOfFamily, getAssignmentsForUser } from "@/lib/auth-scope";
import UserMirror from "@/components/admin/UserMirror";
import StreakFlame from "@/components/gamification/StreakFlame";
import ChildPicker from "@/components/admin/ChildPicker";
import Link from "next/link";
import type { Chore, ChoreCompletion, DailyBonus, UserBadge, Streak } from "@/lib/types";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const adminClient = createAdminClient();
  const [child, allChildren] = await Promise.all([
    resolveChild(ctx.familyId, searchParams, ctx.isSuperAdmin),
    getChildrenOfFamily(ctx.familyId),
  ]);

  const today = getTodayIST();
  const todayDow = getDayOfWeek(today);

  if (!child) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-fg">Family Overview</h1>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-8 text-center">
          <p className="text-fg-muted mb-4">No children added yet.</p>
          <Link
            href="/admin/family"
            className="inline-block rounded-xl bg-accent-amber/20 text-accent-amber px-4 py-2 text-sm font-semibold hover:bg-accent-amber/40 transition-colors"
          >
            Add your first child →
          </Link>
        </div>
      </div>
    );
  }

  const ridham = child;

  const [
    { data: choresData },
    { data: completionsData },
    { data: streaksData },
    { data: bonusesData },
    { data: userBadgesData },
    assignments,
  ] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).eq("family_id", ctx.familyId).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", ridham.id),
    adminClient.from("streaks").select("*").eq("user_id", ridham.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", ridham.id),
    adminClient.from("user_badges").select("*").eq("user_id", ridham.id),
    getAssignmentsForUser(ridham.id),
  ]);

  const allChores = (choresData as Chore[] | null) ?? [];
  const assignedIds = new Set(
    assignments.filter((a) => a.removed_at === null).map((a) => a.chore_id),
  );
  const chores = allChores.filter((c) => assignedIds.has(c.id));
  const completions = (completionsData as ChoreCompletion[] | null) ?? [];
  const streaks = (streaksData as Streak[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];

  const todaysChores = getChoresForDay(chores, todayDow);

  const totalPoints =
    completions.reduce((s, c) => s + (c.points_earned ?? 0), 0) +
    bonuses.reduce((s, b) => s + b.points_bonus, 0);

  const overallStreak = computeOverallStreak(chores, completions, today, assignments);
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
    { href: "/admin/family", icon: "👨‍👩‍👧", label: "Family" },
    { href: `/admin/view-as-user?child=${ridham.id}`, icon: "👁️", label: `View as ${ridham.name?.split(" ")[0] ?? "Child"}` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Overview</h1>
        <p className="text-sm text-fg-muted mt-1">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <ChildPicker kids={allChildren} currentChildId={ridham.id} />

      {chores.length === 0 && (
        <Link
          href="/admin/onboarding"
          className="rounded-2xl border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-sm text-accent-amber hover:bg-accent-amber/20 transition-colors"
        >
          🎮 No tasks set up yet. <span className="font-semibold underline">Run the onboarding wizard →</span>
        </Link>
      )}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
