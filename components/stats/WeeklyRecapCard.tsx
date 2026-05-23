import type { WeeklyRecap } from "@/lib/insights";

interface WeeklyRecapCardProps {
  recap: WeeklyRecap;
}

function fmt(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function WeeklyRecapCard({ recap }: WeeklyRecapCardProps) {
  const pctSign = recap.percentVsPrev !== null && recap.percentVsPrev > 0 ? "+" : "";
  const pctColor =
    recap.percentVsPrev === null
      ? "text-fg-muted"
      : recap.percentVsPrev >= 0
      ? "text-accent-teal"
      : "text-red-400";

  return (
    <div className="rounded-2xl border border-accent-amber/40 bg-gradient-to-br from-accent-amber/10 to-accent-teal/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-accent-amber uppercase tracking-widest font-bold">
              📜 Weekly Recap
            </p>
            <p className="font-display font-bold text-fg mt-1">
              Week of {fmt(recap.weekStart)}
            </p>
          </div>
          {recap.percentVsPrev !== null && (
            <div className="text-right">
              <p className={`font-display font-bold text-xl ${pctColor}`}>
                {pctSign}{recap.percentVsPrev}%
              </p>
              <p className="text-[10px] text-fg-muted">vs prev week</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 divide-x divide-[var(--border)] border-b border-[var(--border)]">
        <div className="px-4 py-3 text-center">
          <p className="font-display font-bold text-2xl text-fg">{recap.totalChores}</p>
          <p className="text-xs text-fg-muted mt-0.5">chores ✅</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="font-display font-bold text-2xl text-accent-amber">{recap.totalXP}</p>
          <p className="text-xs text-fg-muted mt-0.5">XP earned ⚡</p>
        </div>
      </div>

      {/* Highlights */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {recap.bestDayDate && recap.bestDayChores > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xl">🌟</span>
            <p className="text-sm text-fg">
              Best day:{" "}
              <span className="font-semibold">
                {fmt(recap.bestDayDate)}
              </span>{" "}
              — {recap.bestDayChores} chores · {recap.bestDayXP} XP
            </p>
          </div>
        )}

        {recap.topChoreName && (
          <div className="flex items-center gap-3">
            <span className="text-xl">{recap.topChoreIcon ?? "⭐"}</span>
            <p className="text-sm text-fg">
              <span className="font-semibold">{recap.topChoreName}</span>
              {recap.topChoreScheduled > 0 && (
                <span className="text-fg-muted">
                  {" "}— {recap.topChoreCompleted}/{recap.topChoreScheduled} days
                  {recap.topChoreCompleted === recap.topChoreScheduled && " 🏆"}
                </span>
              )}
            </p>
          </div>
        )}

        {recap.comebacks > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xl">💪</span>
            <p className="text-sm text-fg">
              Bounced back{" "}
              <span className="font-semibold">
                {recap.comebacks} time{recap.comebacks > 1 ? "s" : ""}
              </span>
            </p>
          </div>
        )}

        {recap.newBadgeTitles.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xl">🏅</span>
            <p className="text-sm text-fg">
              New badges:{" "}
              <span className="font-semibold">
                {recap.newBadgeTitles.join(", ")}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
