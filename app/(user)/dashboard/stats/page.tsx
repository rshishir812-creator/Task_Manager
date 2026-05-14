import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLevelInfo } from "@/lib/points-calculator";
import { getTodayIST } from "@/lib/streak-calculator";
import XPBar from "@/components/gamification/XPBar";
import StreakFlame from "@/components/gamification/StreakFlame";
import type { Chore, ChoreCompletion, Streak, DailyBonus } from "@/lib/types";

function startOf(period: "week" | "month", today: string): string {
  if (period === "month") return today.slice(0, 8) + "01";
  const parts = today.split("-").map(Number);
  const dt = new Date(Date.UTC(parts[0] ?? 2000, (parts[1] ?? 1) - 1, parts[2] ?? 1));
  dt.setUTCDate(dt.getUTCDate() - dt.getUTCDay()); // back to Sunday
  return dt.toISOString().slice(0, 10);
}

export default async function StatsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const [
    { data: choresData },
    { data: completionsData },
    { data: streaksData },
    { data: bonusesData },
  ] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", user.id),
    adminClient.from("streaks").select("*").eq("user_id", user.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", user.id),
  ]);

  const chores = (choresData as Chore[] | null) ?? [];
  const completions = (completionsData as ChoreCompletion[] | null) ?? [];
  const streaks = (streaksData as Streak[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];

  const totalPoints =
    completions.reduce((s, c) => s + (c.points_earned ?? 0), 0) +
    bonuses.reduce((s, b) => s + b.points_bonus, 0);

  const levelInfo = getLevelInfo(totalPoints);

  const today = getTodayIST();
  const weekStart = startOf("week", today);
  const monthStart = startOf("month", today);

  const weekPoints = completions
    .filter((c) => c.completed_date >= weekStart)
    .reduce((s, c) => s + (c.points_earned ?? 0), 0);

  const monthPoints = completions
    .filter((c) => c.completed_date >= monthStart)
    .reduce((s, c) => s + (c.points_earned ?? 0), 0);

  const overallStreak = streaks.find((s) => s.chore_id === null);
  const choreStreaksSorted = [...streaks]
    .filter((s) => s.chore_id !== null)
    .sort((a, b) => b.current_streak - a.current_streak);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl text-fg">Your Stats 📊</h1>

      {/* Level / XP card */}
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-fg-muted uppercase tracking-wide">Total XP</p>
            <p className="font-display font-bold text-3xl text-accent-amber">
              {totalPoints.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-fg-muted uppercase tracking-wide">Level</p>
            <p className="font-display font-bold text-3xl text-accent-teal">
              {levelInfo.level}
            </p>
          </div>
        </div>
        <XPBar totalPoints={totalPoints} />
      </div>

      {/* Overall streak */}
      {overallStreak && (
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

      {/* Points breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
          <p className="font-display font-bold text-2xl text-fg">{weekPoints}</p>
          <p className="text-xs text-fg-muted mt-1">This Week</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
          <p className="font-display font-bold text-2xl text-fg">{monthPoints}</p>
          <p className="text-xs text-fg-muted mt-1">This Month</p>
        </div>
      </div>

      {/* Per-chore streak leaderboard */}
      {choreStreaksSorted.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-fg mb-3">🏅 Chore Streaks</h2>
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
                      <p className="text-xs text-fg-muted">
                        Best: {s.longest_streak} days
                      </p>
                    </div>
                  </div>
                  <StreakFlame streak={s.current_streak} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion count */}
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 text-center">
        <p className="font-display font-bold text-3xl text-fg">{completions.length}</p>
        <p className="text-sm text-fg-muted mt-1">Total chores completed 🎯</p>
      </div>
    </div>
  );
}
