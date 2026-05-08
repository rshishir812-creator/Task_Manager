import type { Chore, ChoreCompletion, Streak } from "@/lib/types";
import StreakFlame from "@/components/gamification/StreakFlame";

interface UserMirrorProps {
  todaysChores: Chore[];
  completions: ChoreCompletion[];
  streaks: Streak[];
  today: string;
  userName: string;
}

export default function UserMirror({
  todaysChores,
  completions,
  streaks,
  today,
  userName,
}: UserMirrorProps) {
  const completedIds = new Set(
    completions.filter((c) => c.completed_date === today).map((c) => c.chore_id)
  );
  const exceptionIds = new Set(
    completions
      .filter((c) => c.completed_date === today && c.is_exception)
      .map((c) => c.chore_id)
  );
  const choreStreakMap = new Map(
    streaks.filter((s) => s.chore_id).map((s) => [s.chore_id!, s.current_streak])
  );

  const doneCount = todaysChores.filter(
    (c) => completedIds.has(c.id) && !exceptionIds.has(c.id)
  ).length;
  const exceptCount = todaysChores.filter((c) => exceptionIds.has(c.id)).length;
  const pendingCount = todaysChores.length - doneCount - exceptCount;
  const allDone = doneCount + exceptCount === todaysChores.length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div>
          <h2 className="font-display font-bold text-fg">{userName}&apos;s Today</h2>
          <p className="text-xs text-fg-muted mt-0.5">
            {doneCount}/{todaysChores.length} done
            {exceptCount > 0 && ` · ${exceptCount} exception${exceptCount > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allDone ? (
            <span className="text-xs bg-accent-teal/20 text-accent-teal px-2 py-1 rounded-full font-semibold">
              ✓ All done!
            </span>
          ) : pendingCount > 0 ? (
            <span className="text-xs bg-accent-amber/20 text-accent-amber px-2 py-1 rounded-full font-semibold">
              {pendingCount} pending
            </span>
          ) : null}
        </div>
      </div>

      {/* Chore list */}
      {todaysChores.length === 0 ? (
        <p className="px-5 py-4 text-sm text-fg-muted">No chores scheduled today.</p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {todaysChores.map((chore) => {
            const done = completedIds.has(chore.id) && !exceptionIds.has(chore.id);
            const exception = exceptionIds.has(chore.id);
            const streak = choreStreakMap.get(chore.id) ?? 0;

            return (
              <div key={chore.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xl">{chore.icon ?? "✅"}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${done ? "line-through text-fg-muted" : exception ? "text-accent-amber" : "text-fg"}`}
                  >
                    {chore.title}
                  </p>
                  {streak > 0 && (
                    <StreakFlame streak={streak} size="sm" />
                  )}
                </div>
                <span className="text-lg flex-shrink-0">
                  {done ? "✅" : exception ? "⚡" : "⬜"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
