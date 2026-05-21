import type { Chore, ChoreAssignment, ChoreCompletion, DayOfWeek } from "./types";

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

const IST_OFFSET_HOURS = 5.5;
export const DAY_ROLLOVER_HOUR_IST = 7;

/**
 * Returns today's logical date as YYYY-MM-DD in IST.
 * The day rolls over at 7 AM IST — anything before that still counts as yesterday.
 */
export function getTodayIST(): string {
  const now = new Date();
  const shifted = new Date(
    now.getTime() + (IST_OFFSET_HOURS - DAY_ROLLOVER_HOUR_IST) * 60 * 60 * 1000
  );
  return shifted.toISOString().slice(0, 10);
}

/** Returns the day before the given YYYY-MM-DD date, in YYYY-MM-DD. */
export function getYesterdayIST(today: string): string {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Returns chores scheduled for a given day. */
export function getChoresForDay(chores: Chore[], dayOfWeek: DayOfWeek): Chore[] {
  return chores.filter(
    (c) => c.is_active && c.recurrence.includes(dayOfWeek)
  );
}

/**
 * Filters out pending and denied completions. Only verified completions
 * count toward streaks, points, badges, and the daily bonus check.
 */
export function onlyVerified(completions: ChoreCompletion[]): ChoreCompletion[] {
  return completions.filter((c) => c.status === "verified");
}

// ============================================================
// Temporal helpers — a chore only counts toward a date's streak if it
// was alive AND assigned to the user on that date.
// ============================================================

function dateOnly(iso: string | null | undefined): string | null {
  return iso ? iso.slice(0, 10) : null;
}

/** Was the chore in existence (and not yet deactivated) by `dateStr`? */
function isChoreAliveOn(chore: Chore, dateStr: string): boolean {
  const created = dateOnly(chore.created_at);
  if (created && created > dateStr) return false; // didn't exist yet
  const deact = dateOnly(chore.deactivated_at);
  if (deact && deact <= dateStr) return false;     // already retired
  return true;
}

/** Was the assignment row active by `dateStr`? */
function isAssignedOn(assignment: ChoreAssignment | undefined, dateStr: string): boolean {
  if (!assignment) return false;
  const created = dateOnly(assignment.created_at);
  if (created && created > dateStr) return false;
  const removed = dateOnly(assignment.removed_at);
  if (removed && removed <= dateStr) return false;
  return true;
}

/**
 * Computes the current streak for a single chore given its completions.
 * Walks backwards from today. Non-scheduled days are skipped (neutral).
 * Returns 0 if the most recent scheduled day was missed.
 *
 * @param assignment - Optional. The assignment row for this chore × user.
 *                     When provided, days before the assignment existed (or
 *                     after it was removed) are skipped from the walk.
 *                     When omitted, the chore is treated as always assigned
 *                     (legacy callers + the per-chore admin view).
 */
export function computeChoreStreak(
  chore: Chore,
  completions: ChoreCompletion[],
  todayStr: string,
  assignment?: ChoreAssignment
): number {
  const completedDates = new Set(
    onlyVerified(completions)
      .filter((c) => c.chore_id === chore.id)
      .map((c) => c.completed_date)
  );

  let streak = 0;
  const cursor = new Date(todayStr + "T00:00:00");

  for (let i = 0; i < 400; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const day = getDayOfWeek(dateStr);

    const recurrenceMatches = chore.recurrence.includes(day);
    const aliveAndAssigned =
      isChoreAliveOn(chore, dateStr) &&
      (assignment === undefined ? true : isAssignedOn(assignment, dateStr));
    const applies = recurrenceMatches && aliveAndAssigned;

    if (applies) {
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
 *
 * @param assignments - Optional. All assignment rows for the user being
 *                      evaluated. When provided, the per-date "applicable
 *                      chores" set excludes chores that didn't yet exist or
 *                      weren't yet assigned to this user on that date.
 */
export function computeOverallStreak(
  chores: Chore[],
  completions: ChoreCompletion[],
  todayStr: string,
  assignments?: ChoreAssignment[]
): number {
  const byDate = new Map<string, Set<string>>();
  for (const c of onlyVerified(completions)) {
    if (!byDate.has(c.completed_date)) byDate.set(c.completed_date, new Set());
    byDate.get(c.completed_date)!.add(c.chore_id);
  }

  const assignmentByChoreId = new Map<string, ChoreAssignment>();
  if (assignments) {
    for (const a of assignments) assignmentByChoreId.set(a.chore_id, a);
  }

  let streak = 0;
  const cursor = new Date(todayStr + "T00:00:00");

  for (let i = 0; i < 400; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const day = getDayOfWeek(dateStr);

    const scheduled = chores.filter((c) => {
      if (!c.recurrence.includes(day)) return false;
      if (!isChoreAliveOn(c, dateStr)) return false;
      if (assignments !== undefined) {
        if (!isAssignedOn(assignmentByChoreId.get(c.id), dateStr)) return false;
      }
      // Also respect is_active for "currently active" rendering (deactivated_at
      // already handles the historical case)
      return c.is_active || isChoreAliveOn(c, dateStr);
    });

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
