"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Chore, ChoreCompletion, Streak, Profile } from "@/lib/types";
import type { MilestoneProgress } from "@/lib/milestone-calculator";
import { getLevelInfo } from "@/lib/points-calculator";
import ChoreCard from "@/components/chores/ChoreCard";
import XPBar from "@/components/gamification/XPBar";
import StreakFlame from "@/components/gamification/StreakFlame";
import ConfettiBlast from "@/components/gamification/ConfettiBlast";
import LevelUpModal from "@/components/gamification/LevelUpModal";
import BadgeCelebrationModal from "@/components/gamification/BadgeCelebrationModal";
import MilestonesCard from "@/components/gamification/MilestonesCard";

interface DashboardClientProps {
  profile: Profile;
  todaysChores: Chore[];
  initialCompletions: ChoreCompletion[];
  yesterday: string;
  yesterdaysChores: Chore[];
  yesterdayCompletions: ChoreCompletion[];
  streaks: Streak[];
  totalPoints: number;
  today: string;
  overallStreak: number;
  milestones: MilestoneProgress[];
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good Morning, ${name}! ☀️`;
  if (hour < 17) return `Good Afternoon, ${name}! 🌤`;
  return `Good Evening, ${name}! 🌙`;
}

export default function DashboardClient({
  profile,
  todaysChores,
  initialCompletions,
  yesterday,
  yesterdaysChores,
  yesterdayCompletions,
  streaks,
  totalPoints: initialPoints,
  today,
  overallStreak: initialOverallStreak,
  milestones,
}: DashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"today" | "yesterday">("today");
  const [completions, setCompletions] = useState<ChoreCompletion[]>([
    ...initialCompletions,
    ...yesterdayCompletions,
  ]);
  const [totalPoints, setTotalPoints] = useState(initialPoints);
  const [overallStreak, setOverallStreak] = useState(initialOverallStreak);
  const [choreStreaks, setChoreStreaks] = useState<Record<string, number>>(
    Object.fromEntries(
      streaks.filter((s) => s.chore_id).map((s) => [s.chore_id!, s.current_streak])
    )
  );
  const [perfectDay, setPerfectDay] = useState<{ date: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; name: string } | null>(null);
  const [newBadges, setNewBadges] = useState<{ title: string; icon: string; description?: string }[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isYesterday = view === "yesterday";
  const activeDate = isYesterday ? yesterday : today;
  const activeChores = isYesterday ? yesterdaysChores : todaysChores;
  const allChores = [...todaysChores, ...yesterdaysChores];

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const handleComplete = useCallback(
    async (choreId: string, date: string) => {
      const chore = allChores.find((c) => c.id === choreId);
      const tempCompletion: ChoreCompletion = {
        id: `temp-${choreId}-${date}`,
        chore_id: choreId,
        user_id: profile.id,
        completed_date: date,
        is_exception: false,
        exception_reason: null,
        completed_at: new Date().toISOString(),
        points_earned: chore?.points ?? 0,
      };
      setCompletions((prev) => [...prev, tempCompletion]);

      try {
        const res = await fetch("/api/complete-chore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choreId, completedDate: date }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json() as {
          pointsEarned: number;
          newChoreStreak: number;
          newOverallStreak: number;
          badgesAwarded: { title: string; icon: string; description?: string }[];
          dailyBonusAwarded: boolean;
          allComplete: boolean;
        };

        const prevLevel = getLevelInfo(totalPoints).level;
        const newTotalPoints = totalPoints + data.pointsEarned + (data.dailyBonusAwarded ? 50 : 0);
        const newLevelInfo = getLevelInfo(newTotalPoints);

        setTotalPoints(newTotalPoints);
        setOverallStreak(data.newOverallStreak);
        setChoreStreaks((prev) => ({ ...prev, [choreId]: data.newChoreStreak }));
        startTransition(() => router.refresh());
        window.dispatchEvent(new CustomEvent("chore:completed"));

        const dayLabel = date === today ? "today" : "yesterday";
        if (data.dailyBonusAwarded) {
          showToast(`🎉 +50 bonus for completing all of ${dayLabel}'s chores!`);
        }
        if (data.badgesAwarded.length > 0) setNewBadges(data.badgesAwarded);
        if (newLevelInfo.level > prevLevel) {
          setLevelUp({ level: newLevelInfo.level, name: newLevelInfo.name });
        }
        if (data.allComplete) setPerfectDay({ date });
      } catch {
        setCompletions((prev) => prev.filter((c) => c.id !== `temp-${choreId}-${date}`));
        showToast("❌ Failed to save. Please try again.");
      }
    },
    [profile.id, allChores, totalPoints, today, router]
  );

  const handleUncomplete = useCallback(
    async (choreId: string, date: string) => {
      const removed = completions.find(
        (c) => c.chore_id === choreId && c.completed_date === date
      );
      setCompletions((prev) =>
        prev.filter((c) => !(c.chore_id === choreId && c.completed_date === date))
      );
      try {
        const res = await fetch("/api/uncomplete-chore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choreId, completedDate: date }),
        });
        if (!res.ok) throw new Error("Failed");
        if (removed?.points_earned) setTotalPoints((p) => p - (removed.points_earned ?? 0));
        startTransition(() => router.refresh());
      } catch {
        if (removed) setCompletions((prev) => [...prev, removed]);
        showToast("❌ Failed to undo. Please try again.");
      }
    },
    [completions, router]
  );

  const handleException = useCallback(
    async (choreId: string, date: string, reason: string) => {
      const tempEx: ChoreCompletion = {
        id: `temp-ex-${choreId}-${date}`,
        chore_id: choreId,
        user_id: profile.id,
        completed_date: date,
        is_exception: true,
        exception_reason: reason,
        completed_at: new Date().toISOString(),
        points_earned: 0,
      };
      setCompletions((prev) => [...prev, tempEx]);
      try {
        const res = await fetch("/api/complete-chore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choreId, completedDate: date, isException: true, exceptionReason: reason }),
        });
        if (!res.ok) throw new Error("Failed");
        startTransition(() => router.refresh());
        showToast("⚡ Exception saved — streak preserved!");
      } catch {
        setCompletions((prev) => prev.filter((c) => c.id !== `temp-ex-${choreId}-${date}`));
        showToast("❌ Failed to save exception.");
      }
    },
    [profile.id, router]
  );

  const completedActive = completions.filter(
    (c) => c.completed_date === activeDate && !c.is_exception
  );
  const activePoints = completedActive.reduce((sum, c) => sum + (c.points_earned ?? 0), 0);
  const levelInfo = getLevelInfo(totalPoints);

  const activeDateLabel = new Date(`${activeDate}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const perfectDayIsYesterday = perfectDay?.date === yesterday;

  return (
    <>
      {perfectDay && (
        <>
          <ConfettiBlast particleCount={150} onDone={() => setPerfectDay(null)} />
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setPerfectDay(null)}
          >
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <p className="font-display font-bold text-3xl text-accent-teal">
                PERFECT DAY!
              </p>
              <p className="text-fg-muted mt-2">
                +50 bonus points earned{perfectDayIsYesterday ? " (for yesterday)" : ""}!
              </p>
            </div>
          </div>
        </>
      )}

      {levelUp && (
        <LevelUpModal
          level={levelUp.level}
          levelName={levelUp.name}
          onDone={() => setLevelUp(null)}
        />
      )}

      {newBadges.length > 0 && (
        <BadgeCelebrationModal
          badges={newBadges}
          onDone={() => setNewBadges([])}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-xs text-center transition-all">
          {toastMsg}
        </div>
      )}

      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-bg-elevated p-5 mb-4">
        {/* Subtle star bg */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--accent-teal) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <p className="font-display text-sm text-fg-muted mb-1">{activeDateLabel}</p>
        <h1 className="font-display font-bold text-2xl text-fg leading-tight mb-1">
          {getGreeting(profile.name?.split(" ")[0] ?? "Adventurer")}
        </h1>
        <p className="text-xs text-fg-muted mb-3">
          Lv.{levelInfo.level} {levelInfo.name} · {totalPoints.toLocaleString()} XP total
        </p>

        {/* Today / Yesterday toggle */}
        <div className="relative inline-flex items-center gap-1 rounded-full bg-bg p-1 mb-3 border border-[var(--border)]">
          <button
            onClick={() => setView("today")}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              !isYesterday
                ? "bg-accent-teal/20 text-accent-teal"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setView("yesterday")}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              isYesterday
                ? "bg-accent-teal/20 text-accent-teal"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            Yesterday
          </button>
        </div>

        {/* XP Bar */}
        <XPBar totalPoints={totalPoints} />

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-bg p-3 text-center">
            <p className="font-display font-bold text-lg text-accent-amber">{activePoints}</p>
            <p className="text-xs text-fg-muted">{isYesterday ? "Yesterday's" : "Today's"} pts</p>
          </div>
          <div className="rounded-xl bg-bg p-3 text-center">
            <p className="font-display font-bold text-lg text-accent-teal">
              {completedActive.length}/{activeChores.length}
            </p>
            <p className="text-xs text-fg-muted">Chores done</p>
          </div>
          <div className="rounded-xl bg-bg p-3 text-center flex flex-col items-center justify-center">
            <StreakFlame streak={overallStreak} size="md" />
            <p className="text-xs text-fg-muted">Streak</p>
          </div>
        </div>
      </div>

      <MilestonesCard milestones={milestones} />

      {isYesterday && (
        <div className="mb-3 rounded-xl border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-xs text-accent-amber">
          📅 Editing yesterday — changes still count toward your streak.
        </div>
      )}

      {/* Chores section */}
      <h2 className="font-display font-bold text-lg text-fg mb-3">
        {isYesterday ? "Yesterday's" : "Today's"} Quests ⚔️
      </h2>

      {activeChores.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-8 text-center">
          <p className="text-3xl mb-2">🎊</p>
          <p className="font-display font-semibold text-fg">
            No chores {isYesterday ? "yesterday" : "today"}!
          </p>
          <p className="text-sm text-fg-muted mt-1">
            {isYesterday ? "Nothing to fix up." : "Enjoy your day off."}
          </p>
        </div>
      ) : (
        <div className={`grid gap-3 ${isPending ? "opacity-80" : ""}`}>
          {activeChores.map((chore, i) => {
            const completion = completions.find(
              (c) => c.chore_id === chore.id && c.completed_date === activeDate
            );
            return (
              <ChoreCard
                key={`${chore.id}-${activeDate}`}
                chore={chore}
                completion={completion}
                streak={choreStreaks[chore.id] ?? 0}
                date={activeDate}
                index={i}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onException={handleException}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
