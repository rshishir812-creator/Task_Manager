import type { Streak, Chore } from "@/lib/types";

interface StreakGalaxyProps {
  streaks: Streak[];
  chores: Chore[];
}

function flameSize(streak: number): { emoji: string; textClass: string; bgClass: string } {
  if (streak >= 14) return { emoji: "🔥", textClass: "text-3xl", bgClass: "bg-accent-amber/20 border-accent-amber/50" };
  if (streak >= 7) return { emoji: "🔥", textClass: "text-2xl", bgClass: "bg-accent-amber/10 border-accent-amber/30" };
  return { emoji: "🔥", textClass: "text-lg", bgClass: "bg-[var(--border)]/50 border-[var(--border)]" };
}

export default function StreakGalaxy({ streaks, chores }: StreakGalaxyProps) {
  const active = streaks
    .filter((s) => s.chore_id !== null && s.current_streak > 0)
    .sort((a, b) => b.current_streak - a.current_streak);

  if (active.length === 0) return null;

  return (
    <div>
      <h2 className="font-display font-semibold text-fg mb-1">🌌 Streak Galaxy</h2>
      <p className="text-xs text-fg-muted mb-4">Bigger flame = longer streak</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {active.map((s) => {
          const chore = chores.find((c) => c.id === s.chore_id);
          if (!chore) return null;
          const { emoji, textClass, bgClass } = flameSize(s.current_streak);
          return (
            <div
              key={s.id}
              className={`rounded-2xl border p-3 text-center ${bgClass}`}
              title={`${chore.title} · ${s.current_streak} days`}
            >
              <div className="text-2xl mb-1">{chore.icon ?? "✅"}</div>
              <p
                className={`leading-none font-bold text-accent-amber animate-[flicker_1.5s_ease-in-out_infinite] ${textClass}`}
              >
                {emoji}
              </p>
              <p className="font-display font-bold text-sm text-fg mt-1">
                {s.current_streak}d
              </p>
              <p className="text-[10px] text-fg-muted mt-0.5 leading-tight truncate">
                {chore.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
