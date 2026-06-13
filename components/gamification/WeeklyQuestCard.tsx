"use client";

export interface QuestView {
  title: string;
  description: string | null;
  icon: string | null;
  current: number;
  target: number;
  rewardPoints: number;
  complete: boolean;
  claimed: boolean;
  daysLeft: number;
}

export default function WeeklyQuestCard({ quest }: { quest: QuestView }) {
  const pct = Math.max(0, Math.min(1, quest.target > 0 ? quest.current / quest.target : 0));
  const done = quest.complete || quest.claimed;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent-teal/30 bg-bg-elevated p-4 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">{quest.icon ?? "🎯"}</span>
          <div className="min-w-0">
            <p className="font-display font-bold text-fg text-sm leading-tight">
              Weekly Quest
            </p>
            <p className="text-xs text-fg-muted truncate">{quest.title}</p>
          </div>
        </div>
        <span className="flex-shrink-0 rounded-full bg-accent-amber/15 text-accent-amber text-xs font-bold px-2.5 py-1">
          +{quest.rewardPoints.toLocaleString()} XP
        </span>
      </div>

      {quest.description && (
        <p className="text-sm text-fg mt-3">{quest.description}</p>
      )}

      {/* Progress */}
      <div className="mt-3">
        <div className="h-2.5 rounded-full bg-bg overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${done ? "bg-accent-teal" : "bg-accent-amber"}`}
            style={{ width: `${done ? 100 : pct * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-fg-muted">
            {done ? "Completed" : `${quest.current} / ${quest.target}`}
          </p>
          <p className="text-xs text-fg-muted">
            {done
              ? "🎉 Reward earned"
              : quest.daysLeft <= 0
                ? "Ends today"
                : `${quest.daysLeft} day${quest.daysLeft === 1 ? "" : "s"} left`}
          </p>
        </div>
      </div>
    </div>
  );
}
