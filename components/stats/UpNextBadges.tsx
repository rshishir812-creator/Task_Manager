import type { MilestoneProgress } from "@/lib/milestone-calculator";

interface UpNextBadgesProps {
  milestones: MilestoneProgress[];
  max?: number;
}

export default function UpNextBadges({ milestones, max = 3 }: UpNextBadgesProps) {
  const top = milestones.slice(0, max);
  if (top.length === 0) return null;

  return (
    <div>
      <h2 className="font-display font-semibold text-fg mb-3">🎯 Up Next</h2>
      <div className="flex flex-col gap-2">
        {top.map((m) => {
          const pct = Math.round(m.progressFraction * 100);
          const isClose = m.distance <= 3;
          return (
            <div
              key={m.badge.id}
              className={`rounded-2xl border p-4 ${
                isClose
                  ? "border-accent-amber/50 bg-accent-amber/5"
                  : "border-[var(--border)] bg-bg-elevated"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{m.badge.icon ?? "🏅"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-fg text-sm">
                    {m.badge.title}
                  </p>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {m.distance === 1
                      ? `1 more to unlock!`
                      : `${m.distance} more to unlock`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-base text-accent-amber leading-none">
                    {m.current}
                    <span className="text-fg-muted text-xs"> / {m.target}</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-teal to-accent-amber transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
