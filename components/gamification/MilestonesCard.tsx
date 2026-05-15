import Link from "next/link";
import type { MilestoneProgress } from "@/lib/milestone-calculator";

export default function MilestonesCard({
  milestones,
}: {
  milestones: MilestoneProgress[];
}) {
  if (milestones.length === 0) return null;

  return (
    <Link
      href="/dashboard/badges"
      className="block rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 mb-4 hover:border-accent-teal/40 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-base text-fg">🎯 Next Up</h2>
        <span className="text-xs text-fg-muted">View all →</span>
      </div>
      <ul className="space-y-3">
        {milestones.map((m) => {
          const icon = m.badge.icon ?? m.chore?.icon ?? "🏅";
          const unit = m.badge.badge_type === "milestone" ? "completion" : "day";
          const distanceLabel = `${m.distance} ${unit}${m.distance === 1 ? "" : "s"} to go`;
          return (
            <li key={m.badge.id} className="flex items-center gap-3">
              <span className="text-2xl shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-fg truncate">
                    {m.badge.title}
                  </p>
                  <p className="text-xs text-fg-muted shrink-0">
                    {m.current}/{m.target}
                  </p>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-teal transition-all"
                    style={{ width: `${m.progressFraction * 100}%` }}
                  />
                </div>
                <p className="text-xs text-fg-muted mt-1">{distanceLabel}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Link>
  );
}
