"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Chore, ChoreCompletion } from "@/lib/types";
import { getDayOfWeek, getChoresForDay } from "@/lib/streak-calculator";

interface AdminCalendarProps {
  chores: Chore[];
  completions: ChoreCompletion[];
  userId: string;
  today: string;
}

function buildMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const count = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= count; d++) {
    days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

export default function AdminCalendar({ chores, completions, userId, today }: AdminCalendarProps) {
  const router = useRouter();
  const todayDate = new Date(today + "T00:00:00");
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selected, setSelected] = useState<string | null>(today);
  const [localCompletions, setLocalCompletions] = useState(completions);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const days = buildMonthDays(viewYear, viewMonth);
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function getDayStatus(date: string) {
    const dow = getDayOfWeek(date);
    const scheduled = getChoresForDay(chores, dow);
    if (scheduled.length === 0) return "no-chores";
    const done = localCompletions.filter(
      (c) => c.completed_date === date && !c.is_exception
    ).map((c) => c.chore_id);
    const doneSet = new Set(done);
    if (scheduled.every((c) => doneSet.has(c.id))) return "complete";
    if (done.length > 0) return "partial";
    if (date > today) return "future";
    return "missed";
  }

  const STATUS_CLASS: Record<string, string> = {
    complete: "bg-accent-teal text-black font-bold",
    partial: "bg-accent-amber text-black",
    missed: "bg-red-500/70 text-white",
    future: "bg-[var(--border)] text-fg-muted opacity-40",
    "no-chores": "bg-[var(--border)]/40 text-fg-muted",
  };

  async function toggleChore(choreId: string, date: string, currentState: "done" | "exception" | "none") {
    const key = `${choreId}-${date}`;
    setSaving(key);

    let action: "complete" | "uncomplete" | "exception";
    if (currentState === "none") action = "complete";
    else if (currentState === "done") action = "exception";
    else action = "uncomplete"; // exception → none

    try {
      const res = await fetch("/api/admin/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, choreId, date, action }),
      });
      if (!res.ok) throw new Error();

      setLocalCompletions((prev) => {
        const filtered = prev.filter(
          (c) => !(c.chore_id === choreId && c.completed_date === date)
        );
        if (action === "uncomplete") return filtered;
        const chore = chores.find((c) => c.id === choreId);
        return [
          ...filtered,
          {
            id: `admin-${choreId}-${date}`,
            chore_id: choreId,
            user_id: userId,
            completed_date: date,
            is_exception: action === "exception",
            exception_reason: null,
            completed_at: new Date().toISOString(),
            points_earned: action === "exception" ? 0 : (chore?.points ?? 0),
          },
        ];
      });
      showToast(action === "uncomplete" ? "Removed" : action === "exception" ? "⚡ Marked exception" : "✅ Marked complete");
      router.refresh();
    } catch {
      showToast("❌ Failed to update");
    } finally {
      setSaving(null);
    }
  }

  const selectedChores = selected
    ? getChoresForDay(chores, getDayOfWeek(selected))
    : [];

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Month nav */}
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-fg-muted hover:text-fg px-2 py-1 rounded-lg" aria-label="Prev">←</button>
          <span className="font-display font-semibold text-fg">{monthLabel}</span>
          <button onClick={nextMonth} className="text-fg-muted hover:text-fg px-2 py-1 rounded-lg" aria-label="Next">→</button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
            <div key={d} className="text-center text-xs text-fg-muted py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {days.map((date) => {
            const status = getDayStatus(date);
            const d = parseInt(date.slice(8));
            return (
              <button
                key={date}
                onClick={() => setSelected(date === selected ? null : date)}
                className={`aspect-square rounded-lg text-xs flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-amber ${STATUS_CLASS[status] ?? ""} ${date === selected ? "ring-2 ring-accent-amber scale-110" : ""}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day editor */}
      {selected && (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="font-display font-semibold text-fg">
              {new Date(selected + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-fg-muted mt-0.5">Tap to cycle: ⬜ → ✅ → ⚡ → ⬜</p>
          </div>

          {selectedChores.length === 0 ? (
            <p className="px-4 py-3 text-sm text-fg-muted">No chores scheduled.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {selectedChores.map((chore) => {
                const comp = localCompletions.find(
                  (c) => c.chore_id === chore.id && c.completed_date === selected
                );
                const state: "done" | "exception" | "none" = comp
                  ? comp.is_exception ? "exception" : "done"
                  : "none";
                const key = `${chore.id}-${selected}`;

                return (
                  <button
                    key={chore.id}
                    onClick={() => toggleChore(chore.id, selected, state)}
                    disabled={saving === key}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors text-left disabled:opacity-50"
                  >
                    <span className="text-xl">{chore.icon ?? "✅"}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${state === "done" ? "line-through text-fg-muted" : "text-fg"}`}>
                        {chore.title}
                      </p>
                      <p className="text-xs text-fg-muted">+{chore.points} pts</p>
                    </div>
                    <span className="text-lg flex-shrink-0">
                      {saving === key ? "⏳" : state === "done" ? "✅" : state === "exception" ? "⚡" : "⬜"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
