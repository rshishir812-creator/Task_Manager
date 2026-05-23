import type { SiblingEntry } from "@/lib/insights";

interface SiblingCupProps {
  entries: SiblingEntry[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function SiblingCup({ entries }: SiblingCupProps) {
  if (entries.length < 2) return null;

  return (
    <div>
      <h2 className="font-display font-semibold text-fg mb-1">🏅 Sibling Cup</h2>
      <p className="text-xs text-fg-muted mb-4">This week · ranked by consistency</p>
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
        {entries.map((entry, i) => {
          const isLeader = i === 0;
          return (
            <div
              key={entry.kidId}
              className={`flex items-center gap-3 px-4 py-3 ${
                i > 0 ? "border-t border-[var(--border)]" : ""
              } ${isLeader ? "bg-accent-amber/5" : ""}`}
            >
              <span className="text-xl w-6 text-center flex-shrink-0">
                {MEDALS[i] ?? `${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-display font-semibold text-sm ${isLeader ? "text-accent-amber" : "text-fg"}`}>
                  {entry.name}
                  {isLeader && <span className="ml-1 text-accent-amber">👑</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-20 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isLeader
                        ? "bg-gradient-to-r from-accent-amber to-accent-teal"
                        : "bg-[var(--border-strong,#444)]"
                    }`}
                    style={{ width: `${entry.weeklyConsistencyPct}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-bold w-9 text-right ${
                    isLeader ? "text-accent-amber" : "text-fg"
                  }`}
                >
                  {entry.weeklyConsistencyPct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
