"use client";

import { useState } from "react";
import type { Chore, ChoreCompletion } from "@/lib/types";
import { getDayOfWeek, getChoresForDay } from "@/lib/streak-calculator";

interface DayData {
  date: string;
  status: "complete" | "partial" | "missed" | "future" | "no-chores";
  completedCount: number;
  totalCount: number;
  completions: ChoreCompletion[];
}

interface HeatmapCalendarProps {
  chores: Chore[];
  completions: ChoreCompletion[];
  today: string;
}

function buildMonth(year: number, month: number, chores: Chore[], completions: ChoreCompletion[], today: string): DayData[] {
  const days: DayData[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = getDayOfWeek(dateStr);
    const scheduled = getChoresForDay(chores, dow);
    const dayCompletions = completions.filter((c) => c.completed_date === dateStr);
    const completedIds = new Set(dayCompletions.map((c) => c.chore_id));
    const completedCount = scheduled.filter((c) => completedIds.has(c.id)).length;
    const totalCount = scheduled.length;

    let status: DayData["status"];
    if (dateStr > today) status = "future";
    else if (totalCount === 0) status = "no-chores";
    else if (completedCount === totalCount) status = "complete";
    else if (completedCount > 0) status = "partial";
    else status = "missed";

    days.push({ date: dateStr, status, completedCount, totalCount, completions: dayCompletions });
  }
  return days;
}

const STATUS_CLASS: Record<DayData["status"], string> = {
  complete: "bg-accent-teal text-black font-bold",
  partial: "bg-accent-amber text-black",
  missed: "bg-red-500/70 text-white",
  future: "bg-[var(--border)] text-fg-muted opacity-40",
  "no-chores": "bg-[var(--border)]/40 text-fg-muted",
};

export default function HeatmapCalendar({ chores, completions, today }: HeatmapCalendarProps) {
  const todayDate = new Date(today + "T00:00:00");
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selected, setSelected] = useState<DayData | null>(null);

  const days = buildMonth(viewYear, viewMonth, chores, completions, today);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    const now = new Date();
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-fg-muted hover:text-fg px-2 py-1 rounded-lg transition-colors" aria-label="Previous month">←</button>
        <span className="font-display font-semibold text-fg">{monthLabel}</span>
        <button onClick={nextMonth} className="text-fg-muted hover:text-fg px-2 py-1 rounded-lg transition-colors" aria-label="Next month">→</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-center text-xs text-fg-muted py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const d = parseInt(day.date.slice(8));
          return (
            <button
              key={day.date}
              onClick={() => setSelected(day.status !== "future" ? day : null)}
              disabled={day.status === "future"}
              className={`aspect-square rounded-lg text-xs flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-teal ${STATUS_CLASS[day.status]} ${day.date === today ? "ring-2 ring-accent-teal" : ""}`}
              aria-label={`${day.date}: ${day.completedCount}/${day.totalCount} chores`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs text-fg-muted flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent-teal inline-block" />All done</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent-amber inline-block" />Partial</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/70 inline-block" />Missed</span>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-bg-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold text-fg">
              {new Date(selected.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
            </p>
            <button onClick={() => setSelected(null)} className="text-fg-muted hover:text-fg text-sm">✕</button>
          </div>
          {selected.totalCount === 0 ? (
            <p className="text-sm text-fg-muted">No chores scheduled.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {getChoresForDay(chores, getDayOfWeek(selected.date)).map((chore) => {
                const comp = selected.completions.find((c) => c.chore_id === chore.id);
                return (
                  <div key={chore.id} className="flex items-center gap-3">
                    <span className="text-xl">{chore.icon ?? "✅"}</span>
                    <span className="flex-1 text-sm text-fg">{chore.title}</span>
                    <span className="text-sm">
                      {comp
                        ? comp.is_exception
                          ? "⚡"
                          : "✅"
                        : "❌"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
