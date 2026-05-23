import type { ChoreDifficultyStats } from "@/lib/insights";
import Link from "next/link";

interface ChoreDifficultyTableProps {
  stats: ChoreDifficultyStats[];
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default function ChoreDifficultyTable({ stats }: ChoreDifficultyTableProps) {
  if (stats.length === 0) return null;

  const flagged = stats.filter((s) => s.isFlagged);
  const healthy = stats.filter((s) => !s.isFlagged);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-fg">📊 Chore Health</h2>
        <p className="text-xs text-fg-muted">Last 30 days</p>
      </div>

      {flagged.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
            🚨 Needs attention
          </p>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 overflow-hidden">
            {flagged.map((s, i) => (
              <DifficultyRow key={s.choreId} stat={s} i={i} total={flagged.length} />
            ))}
          </div>
        </div>
      )}

      {healthy.length > 0 && (
        <div>
          {flagged.length > 0 && (
            <p className="text-xs font-semibold text-accent-teal uppercase tracking-wide mb-2">
              ✅ On track
            </p>
          )}
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
            {healthy.map((s, i) => (
              <DifficultyRow key={s.choreId} stat={s} i={i} total={healthy.length} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DifficultyRow({
  stat,
  i,
  total,
}: {
  stat: ChoreDifficultyStats;
  i: number;
  total: number;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        i < total - 1 ? "border-b border-[var(--border)]" : ""
      }`}
    >
      <span className="text-xl flex-shrink-0">{stat.choreIcon ?? "✅"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fg truncate">{stat.choreName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className={`h-full rounded-full ${
                stat.completionRate >= 0.8
                  ? "bg-accent-teal"
                  : stat.completionRate >= 0.5
                  ? "bg-accent-amber"
                  : "bg-red-500/70"
              }`}
              style={{ width: `${Math.round(stat.completionRate * 100)}%` }}
            />
          </div>
          <span className="text-xs text-fg-muted flex-shrink-0">
            {stat.totalCompleted}/{stat.totalScheduled}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-bold ${
            stat.completionRate >= 0.8
              ? "text-accent-teal"
              : stat.completionRate >= 0.5
              ? "text-accent-amber"
              : "text-red-400"
          }`}
        >
          {pct(stat.completionRate)}
        </p>
        {stat.denialRate > 0 && (
          <p className="text-[10px] text-red-400">{pct(stat.denialRate)} denied</p>
        )}
      </div>
      <Link
        href="/admin/chores"
        className="text-[10px] text-fg-muted hover:text-accent-amber px-2 py-1 rounded-lg hover:bg-accent-amber/10 transition-colors"
      >
        Edit
      </Link>
    </div>
  );
}
