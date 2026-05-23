import type { FamilyScore, KidTodayStatus } from "@/lib/insights";

interface FamilyPulseStripProps {
  score: FamilyScore;
  todayStatus: KidTodayStatus[];
  alert?: string | null;
}

function deltaPill(delta: number): { text: string; cls: string } {
  if (delta > 0) return { text: `↑ ${delta}%`, cls: "text-accent-teal" };
  if (delta < 0) return { text: `↓ ${Math.abs(delta)}%`, cls: "text-red-400" };
  return { text: "— flat", cls: "text-fg-muted" };
}

export default function FamilyPulseStrip({
  score,
  todayStatus,
  alert,
}: FamilyPulseStripProps) {
  const pill = deltaPill(score.delta);
  const totalDone = todayStatus.reduce((s, k) => s + k.done, 0);
  const totalDue = todayStatus.reduce((s, k) => s + k.total, 0);
  const onTrackForPerfect = totalDue > 0 && totalDone === totalDue;

  return (
    <div className="rounded-2xl border border-accent-teal/30 bg-gradient-to-br from-accent-teal/5 to-accent-amber/5 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] text-fg-muted uppercase tracking-widest font-semibold">
            Family Pulse
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="font-display font-bold text-3xl text-accent-teal">
              {score.current}%
            </p>
            <span className={`text-sm font-semibold ${pill.cls}`}>{pill.text}</span>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            {score.thisWeekVerified} / {score.thisWeekScheduled} chores · last 7 days
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-fg-muted uppercase tracking-widest font-semibold">
            Today
          </p>
          <p className="font-display font-bold text-xl text-fg mt-1">
            {totalDone}/{totalDue}
          </p>
          {onTrackForPerfect && (
            <p className="text-[10px] text-accent-teal font-semibold mt-0.5">
              Perfect day! 🎯
            </p>
          )}
        </div>
      </div>

      {todayStatus.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {todayStatus.map((k) => {
            const complete = k.total > 0 && k.done === k.total;
            const pending = k.total > 0 && k.done < k.total;
            return (
              <div
                key={k.kidId}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  complete
                    ? "bg-accent-teal/20 text-accent-teal"
                    : pending
                    ? "bg-accent-amber/20 text-accent-amber"
                    : "bg-[var(--border)]/50 text-fg-muted"
                }`}
              >
                <span>{complete ? "✅" : pending ? "⏳" : "💤"}</span>
                <span>
                  {k.name} {k.done}/{k.total}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {alert && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 mt-2">
          <p className="text-xs text-red-300 font-medium">🚨 {alert}</p>
        </div>
      )}
    </div>
  );
}
