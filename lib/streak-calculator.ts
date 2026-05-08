import type { Chore, ChoreCompletion, DayOfWeek } from "./types";

const DAY_INDEX: Record<number, DayOfWeek> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

/** Returns the DayOfWeek key for a given YYYY-MM-DD date string (uses local time). */
export function getDayOfWeek(dateStr: string): DayOfWeek {
  const parts = dateStr.split("-").map(Number);
  const date = new Date(parts[0] ?? 2000, (parts[1] ?? 1) - 1, parts[2] ?? 1);
  return DAY_INDEX[date.getDay()] ?? "sun";
}

/** Returns today's date as YYYY-MM-DD in IST (UTC+5:30). */
export function getTodayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

/** Returns chores scheduled for a given day. */
export function getChoresForDay(chores: Chore[], dayOfWeek: DayOfWeek): Chore[] {
  return chores.filter(
    (c) => c.is_active && c.recurrence.includes(dayOfWeek)
  );
}

/**
 * Computes the current streak for a single chore given its completions.
 * Walks backwards from today. Non-scheduled days are skipped (neutral).
 * Returns 0 if the most recent scheduled day was missed.
 */
export function computeChoreStreak(
  chore: Chore,
  completions: ChoreCompletion[],
  todayStr: string
): number {
  const completedDates = new Set(
    completions
      .filter((c) => c.chore_id === chore.id)
      .map((c) => c.completed_date)
  );

  let streak = 0;
  const cursor = new Date(todayStr + "T00:00:00");

  for (let i = 0; i < 400; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const day = getDayOfWeek(dateStr);

    if (chore.recurrence.includes(day)) {
      if (completedDates.has(dateStr)) {
        streak++;
      } else if (dateStr === todayStr && streak === 0) {
        // Today hasn't been completed yet — don't break streak on today
      } else {
        break;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Computes the overall daily streak: consecutive days where ALL scheduled
 * chores were completed or excepted.
 */
export function computeOverallStreak(
  chores: Chore[],
  completions: ChoreCompletion[],
  todayStr: string
): number {
  const byDate = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!byDate.has(c.completed_date)) byDate.set(c.completed_date, new Set());
    byDate.get(c.completed_date)!.add(c.chore_id);
  }

  let streak = 0;
  const cursor = new Date(todayStr + "T00:00:00");

  for (let i = 0; i < 400; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const day = getDayOfWeek(dateStr);
    const scheduled = chores.filter(
      (c) => c.is_active && c.recurrence.includes(day)
    );

    if (scheduled.length === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    const done = byDate.get(dateStr) ?? new Set();
    const allDone = scheduled.every((c) => done.has(c.id));

    if (allDone) {
      streak++;
    } else if (dateStr === todayStr && streak === 0) {
      // Today not finished yet — skip without breaking
    } else {
      break;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
