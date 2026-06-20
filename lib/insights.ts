import type {
  Badge,
  Chore,
  ChoreAssignment,
  ChoreCompletion,
  Profile,
  Streak,
  UserBadge,
} from "./types";
import {
  computeOverallStreak,
  getDayOfWeek,
  onlyVerified,
} from "./streak-calculator";

// ============================================================
// Personal Records
// ============================================================

export type PersonalRecord = {
  label: string;
  emoji: string;
  value: number;
  unit: string;          // "days" | "pts" | "chores" | "total"
  setOn: string | null;  // YYYY-MM-DD when this record was set, when known
  isNew: boolean;        // true if set within last 7 days
};

export type Records = {
  longestStreak: PersonalRecord;
  bestWeek: PersonalRecord;
  bestDay: PersonalRecord;
  mostInDay: PersonalRecord;
  comebacks: PersonalRecord;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(earlier: string, later: string): number {
  const a = new Date(earlier + "T00:00:00").getTime();
  const b = new Date(later + "T00:00:00").getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

/** Sunday-start week containing the given date. */
function weekStartOf(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

/** Hour-of-day in IST for an ISO timestamp. */
function istHour(iso: string): number {
  const d = new Date(iso);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.getUTCHours();
}

export function computePersonalRecords(
  completions: ChoreCompletion[],
  streaks: Streak[],
  today: string,
): Records {
  const verified = onlyVerified(completions);

  // Longest streak — prefer overall streak row (chore_id === null), else max across rows
  const overall = streaks.find((s) => s.chore_id === null);
  const longestStreak = Math.max(
    overall?.longest_streak ?? 0,
    ...streaks.map((s) => s.longest_streak),
    0,
  );
  const longestSetOn = overall?.last_completed ?? null;
  const longestIsNew = longestSetOn
    ? daysBetween(longestSetOn, today) < 7 &&
      (overall?.current_streak ?? 0) === longestStreak
    : false;

  // Per-day tallies
  const dayMap = new Map<string, { points: number; count: number }>();
  for (const c of verified) {
    const row = dayMap.get(c.completed_date) ?? { points: 0, count: 0 };
    row.points += c.points_earned ?? 0;
    row.count += 1;
    dayMap.set(c.completed_date, row);
  }
  let bestDayDate = "";
  let bestDayPts = 0;
  let mostInDayDate = "";
  let mostInDayCount = 0;
  dayMap.forEach((row, date) => {
    if (row.points > bestDayPts) {
      bestDayPts = row.points;
      bestDayDate = date;
    }
    if (row.count > mostInDayCount) {
      mostInDayCount = row.count;
      mostInDayDate = date;
    }
  });

  // Per-week tallies (Sun-Sat)
  const weekMap = new Map<string, { points: number; count: number }>();
  for (const c of verified) {
    const ws = weekStartOf(c.completed_date);
    const row = weekMap.get(ws) ?? { points: 0, count: 0 };
    row.points += c.points_earned ?? 0;
    row.count += 1;
    weekMap.set(ws, row);
  }
  let bestWeekStart = "";
  let bestWeekPts = 0;
  weekMap.forEach((row, ws) => {
    if (row.points > bestWeekPts) {
      bestWeekPts = row.points;
      bestWeekStart = ws;
    }
  });

  // Comebacks — count gaps where there was ≥ 1 missed day before returning to chores
  const dates = Array.from(dayMap.keys()).sort();
  let comebackCount = 0;
  let lastComebackDate = "";
  for (let i = 1; i < dates.length; i++) {
    const gap = daysBetween(dates[i - 1]!, dates[i]!);
    if (gap >= 2) {
      comebackCount++;
      lastComebackDate = dates[i]!;
    }
  }

  return {
    longestStreak: {
      label: "Longest Streak",
      emoji: "🔥",
      value: longestStreak,
      unit: "days",
      setOn: longestSetOn,
      isNew: longestIsNew,
    },
    bestWeek: {
      label: "Best Week",
      emoji: "🚀",
      value: bestWeekPts,
      unit: "pts",
      setOn: bestWeekStart || null,
      isNew: bestWeekStart ? daysBetween(bestWeekStart, today) < 14 : false,
    },
    bestDay: {
      label: "Best Day",
      emoji: "⭐",
      value: bestDayPts,
      unit: "pts",
      setOn: bestDayDate || null,
      isNew: bestDayDate ? daysBetween(bestDayDate, today) < 7 : false,
    },
    mostInDay: {
      label: "Most in a Day",
      emoji: "💥",
      value: mostInDayCount,
      unit: "chores",
      setOn: mostInDayDate || null,
      isNew: mostInDayDate ? daysBetween(mostInDayDate, today) < 7 : false,
    },
    comebacks: {
      label: "Comebacks",
      emoji: "💪",
      value: comebackCount,
      unit: "total",
      setOn: lastComebackDate || null,
      isNew: lastComebackDate ? daysBetween(lastComebackDate, today) < 7 : false,
    },
  };
}

// ============================================================
// Best week (also used by Hero vibe line)
// ============================================================

export type WeekStats = {
  weekStart: string;
  points: number;
  count: number;
};

export function pointsThisWeek(completions: ChoreCompletion[], today: string): number {
  const ws = weekStartOf(today);
  return onlyVerified(completions)
    .filter((c) => c.completed_date >= ws && c.completed_date <= today)
    .reduce((s, c) => s + (c.points_earned ?? 0), 0);
}

// ============================================================
// Time-of-day buckets
// ============================================================

export type TimeOfDayBuckets = {
  morning: number;
  midday: number;
  afternoon: number;
  evening: number;
  other: number;
  total: number;
  personality: string;
  emoji: string;
};

export function computeTimeOfDayBuckets(
  completions: ChoreCompletion[],
): TimeOfDayBuckets {
  const verified = onlyVerified(completions);
  let morning = 0,
    midday = 0,
    afternoon = 0,
    evening = 0,
    other = 0;

  for (const c of verified) {
    if (!c.completed_at) continue;
    const h = istHour(c.completed_at);
    if (h >= 6 && h < 11) morning++;
    else if (h >= 11 && h < 16) midday++;
    else if (h >= 16 && h < 19) afternoon++;
    else if (h >= 19 && h < 22) evening++;
    else other++;
  }

  const total = morning + midday + afternoon + evening + other;
  let personality = "Chore Champion";
  let emoji = "🎯";

  if (total > 0) {
    const max = Math.max(morning, midday, afternoon, evening);
    if (max === morning) {
      personality = "Morning Warrior";
      emoji = "🌅";
    } else if (max === midday) {
      personality = "Midday Master";
      emoji = "☀️";
    } else if (max === afternoon) {
      personality = "Afternoon Crusher";
      emoji = "🏃";
    } else if (max === evening) {
      personality = "Night Owl";
      emoji = "🌙";
    }
  }

  return { morning, midday, afternoon, evening, other, total, personality, emoji };
}

// ============================================================
// Hero vibe line (priority queue)
// ============================================================

export type VibeContext = {
  currentOverallStreak: number;
  nearestMilestone?: { distance: number; badgeTitle: string } | undefined;
  thisWeekPoints: number;
  bestWeekPoints: number;
  todayCompletedCount: number;
  todayScheduledCount: number;
};

export function generateHeroVibeLine(ctx: VibeContext): string {
  const {
    currentOverallStreak,
    nearestMilestone,
    thisWeekPoints,
    bestWeekPoints,
    todayCompletedCount,
    todayScheduledCount,
  } = ctx;

  if (
    todayScheduledCount > 0 &&
    todayCompletedCount === todayScheduledCount
  ) {
    return `🌟 Today's chores done — hero mode!`;
  }
  if (currentOverallStreak >= 7) {
    return `🔥 ${currentOverallStreak}-day streak — keep it lit!`;
  }
  if (nearestMilestone && nearestMilestone.distance <= 3) {
    const pluralC = nearestMilestone.distance === 1 ? "" : "s";
    return `🌟 ${nearestMilestone.distance} chore${pluralC} from ${nearestMilestone.badgeTitle}`;
  }
  if (
    bestWeekPoints > 0 &&
    thisWeekPoints >= bestWeekPoints * 0.85 &&
    thisWeekPoints < bestWeekPoints
  ) {
    return `🚀 Almost at your best week ever — push it!`;
  }
  if (currentOverallStreak >= 3) {
    return `🔥 ${currentOverallStreak}-day streak — keep going!`;
  }
  return `🎯 Every chore counts — let's go!`;
}

// ============================================================
// Family score (parent dashboard)
// ============================================================

export type KidDataForFamily = {
  completions: ChoreCompletion[];
  chores: Chore[];
  assignments: ChoreAssignment[];
  // Phase 8 — holiday date set (YYYY-MM-DD). Dates inside are exempt: not
  // scheduled, not missed. Optional/empty = no holidays (unchanged behaviour).
  holidays?: ReadonlySet<string>;
};

export type FamilyScore = {
  current: number;
  delta: number;
  thisWeekVerified: number;
  thisWeekScheduled: number;
};

function dateOnly(iso: string | null | undefined): string | null {
  return iso ? iso.slice(0, 10) : null;
}

function scheduledOnDate(
  chores: Chore[],
  assignmentByChoreId: Map<string, ChoreAssignment>,
  dateStr: string,
  holidays?: ReadonlySet<string>,
): Chore[] {
  // Holiday date — nothing is "scheduled" (so it's neither done nor missed).
  if (holidays?.has(dateStr)) return [];
  const dow = getDayOfWeek(dateStr);
  return chores.filter((c) => {
    if (!c.recurrence.includes(dow)) return false;
    const created = dateOnly(c.created_at);
    if (created && created > dateStr) return false;
    const deact = dateOnly(c.deactivated_at);
    if (deact && deact <= dateStr) return false;
    const a = assignmentByChoreId.get(c.id);
    if (!a) return false;
    const aCreated = dateOnly(a.created_at);
    if (aCreated && aCreated > dateStr) return false;
    const aRemoved = dateOnly(a.removed_at);
    if (aRemoved && aRemoved <= dateStr) return false;
    return true;
  });
}

function consistencyOver(
  kidsData: KidDataForFamily[],
  start: string,
  end: string,
): { verified: number; scheduled: number } {
  let verified = 0;
  let scheduled = 0;

  for (const k of kidsData) {
    const verifiedSet = onlyVerified(k.completions);
    const completedByDate = new Map<string, Set<string>>();
    for (const c of verifiedSet) {
      if (c.completed_date < start || c.completed_date > end) continue;
      if (!completedByDate.has(c.completed_date)) {
        completedByDate.set(c.completed_date, new Set());
      }
      completedByDate.get(c.completed_date)!.add(c.chore_id);
    }
    const assignmentByChoreId = new Map<string, ChoreAssignment>();
    for (const a of k.assignments) assignmentByChoreId.set(a.chore_id, a);

    const cursor = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const due = scheduledOnDate(k.chores, assignmentByChoreId, dateStr, k.holidays);
      scheduled += due.length;
      const done = completedByDate.get(dateStr) ?? new Set();
      verified += due.filter((c) => done.has(c.id)).length;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { verified, scheduled };
}

export function computeFamilyScore(
  kidsData: KidDataForFamily[],
  today: string,
): FamilyScore {
  const todayDate = new Date(today + "T00:00:00");
  const sixDaysAgo = new Date(todayDate);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  const weekStart = sixDaysAgo.toISOString().slice(0, 10);

  const prevWeekEnd = new Date(todayDate);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);

  const cur = consistencyOver(kidsData, weekStart, today);
  const prev = consistencyOver(
    kidsData,
    prevWeekStart.toISOString().slice(0, 10),
    prevWeekEnd.toISOString().slice(0, 10),
  );

  const curPct =
    cur.scheduled > 0 ? Math.round((cur.verified / cur.scheduled) * 100) : 0;
  const prevPct =
    prev.scheduled > 0 ? Math.round((prev.verified / prev.scheduled) * 100) : 0;

  return {
    current: curPct,
    delta: curPct - prevPct,
    thisWeekVerified: cur.verified,
    thisWeekScheduled: cur.scheduled,
  };
}

// ============================================================
// Champion of the week
// ============================================================

export type KidDataForChampion = KidDataForFamily & {
  profile: Profile;
  badges: UserBadge[];
};

export type ChampionResult = {
  kid: Profile;
  reason: string;
  consistencyPct: number;
  improvementPct: number;
  badgesThisWeek: number;
  currentStreak: number;
} | null;

export function computeChampionOfWeek(
  kidsData: KidDataForChampion[],
  today: string,
): ChampionResult {
  if (kidsData.length === 0) return null;

  // Last completed week (Sun-Sat) — i.e., the week that ended yesterday or earlier
  const todayDate = new Date(today + "T00:00:00Z");
  const dow = todayDate.getUTCDay();
  // Yesterday
  const yesterday = new Date(todayDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  // If today is Sunday, last completed week was previous Sun..Sat. Else, last completed Sat was the most recent Saturday.
  const lastSat = new Date(todayDate);
  lastSat.setUTCDate(lastSat.getUTCDate() - dow - 1);
  const lastSun = new Date(lastSat);
  lastSun.setUTCDate(lastSun.getUTCDate() - 6);
  const prevSat = new Date(lastSun);
  prevSat.setUTCDate(prevSat.getUTCDate() - 1);
  const prevSun = new Date(prevSat);
  prevSun.setUTCDate(prevSun.getUTCDate() - 6);

  const wkStart = lastSun.toISOString().slice(0, 10);
  const wkEnd = lastSat.toISOString().slice(0, 10);
  const prevWkStart = prevSun.toISOString().slice(0, 10);
  const prevWkEnd = prevSat.toISOString().slice(0, 10);

  const candidates = kidsData.map((k) => {
    const cur = consistencyOver([k], wkStart, wkEnd);
    const prev = consistencyOver([k], prevWkStart, prevWkEnd);
    const curPct = cur.scheduled > 0 ? cur.verified / cur.scheduled : 0;
    const prevPct = prev.scheduled > 0 ? prev.verified / prev.scheduled : 0;
    const improvement = curPct - prevPct;
    const badgesThisWeek = k.badges.filter(
      (b) => b.earned_at.slice(0, 10) >= wkStart && b.earned_at.slice(0, 10) <= wkEnd,
    ).length;
    const currentStreak = computeOverallStreak(
      k.chores,
      k.completions,
      today,
      k.assignments,
    );
    return {
      kid: k.profile,
      consistencyPct: curPct,
      improvementPct: improvement,
      badgesThisWeek,
      currentStreak,
    };
  });

  // Prefer candidates with any activity
  const active = candidates.filter(
    (c) =>
      c.consistencyPct > 0 ||
      c.improvementPct > 0 ||
      c.badgesThisWeek > 0 ||
      c.currentStreak > 0,
  );
  const pool = active.length > 0 ? active : candidates;

  pool.sort((a, b) => {
    if (a.improvementPct !== b.improvementPct) {
      return b.improvementPct - a.improvementPct;
    }
    if (a.badgesThisWeek !== b.badgesThisWeek) {
      return b.badgesThisWeek - a.badgesThisWeek;
    }
    if (a.consistencyPct !== b.consistencyPct) {
      return b.consistencyPct - a.consistencyPct;
    }
    return b.currentStreak - a.currentStreak;
  });

  const winner = pool[0];
  if (!winner) return null;

  let reason = "";
  if (winner.improvementPct > 0.1) {
    reason = `Biggest improver — up ${Math.round(winner.improvementPct * 100)}%!`;
  } else if (winner.badgesThisWeek > 0) {
    reason = `Earned ${winner.badgesThisWeek} new badge${
      winner.badgesThisWeek > 1 ? "s" : ""
    } this week`;
  } else if (winner.currentStreak >= 7) {
    reason = `🔥 ${winner.currentStreak}-day streak going strong`;
  } else if (winner.consistencyPct > 0) {
    reason = `${Math.round(winner.consistencyPct * 100)}% consistency`;
  } else {
    reason = `Champion of the week`;
  }

  return {
    kid: winner.kid,
    reason,
    consistencyPct: winner.consistencyPct,
    improvementPct: winner.improvementPct,
    badgesThisWeek: winner.badgesThisWeek,
    currentStreak: winner.currentStreak,
  };
}

// ============================================================
// Today status per kid (for Family Pulse)
// ============================================================

export type KidTodayStatus = {
  kidId: string;
  name: string;
  done: number;
  total: number;
};

export function computeKidsTodayStatus(
  kidsData: Array<{
    profile: Profile;
    completions: ChoreCompletion[];
    chores: Chore[];
    assignments: ChoreAssignment[];
    holidays?: ReadonlySet<string>;
  }>,
  today: string,
): KidTodayStatus[] {
  return kidsData.map((k) => {
    const assignmentByChoreId = new Map<string, ChoreAssignment>();
    for (const a of k.assignments) assignmentByChoreId.set(a.chore_id, a);
    const due = scheduledOnDate(k.chores, assignmentByChoreId, today, k.holidays);
    const done = new Set(
      onlyVerified(k.completions)
        .filter((c) => c.completed_date === today)
        .map((c) => c.chore_id),
    );
    return {
      kidId: k.profile.id,
      name: k.profile.name?.split(" ")[0] ?? "Child",
      done: due.filter((c) => done.has(c.id)).length,
      total: due.length,
    };
  });
}

// ============================================================
// Weekly Recap (Phase 7b)
// ============================================================

export type WeeklyRecap = {
  weekStart: string;   // Sun YYYY-MM-DD
  weekEnd: string;     // Sat YYYY-MM-DD
  totalChores: number;
  totalXP: number;
  bestDayDate: string | null;
  bestDayChores: number;
  bestDayXP: number;
  topChoreName: string | null;
  topChoreIcon: string | null;
  topChoreCompleted: number;
  topChoreScheduled: number;
  newBadgeTitles: string[];
  percentVsPrev: number | null;  // null when no prev data; else signed integer %
  comebacks: number;
};

/** Returns true when the weekly recap card should be visible (Sunday logic). */
export function isRecapDay(today: string): boolean {
  const d = new Date(today + "T12:00:00Z");
  return d.getUTCDay() === 0;  // Sunday
}

export function computeWeeklyRecap(
  completions: ChoreCompletion[],
  chores: Chore[],
  assignments: ChoreAssignment[],
  badges: Badge[],
  userBadges: UserBadge[],
  today: string,
  holidays?: ReadonlySet<string>,
): WeeklyRecap | null {
  if (!isRecapDay(today)) return null;

  // Last complete week: the Sun-Sat that ended yesterday (Saturday)
  const todayDate = new Date(today + "T12:00:00Z");  // today is Sunday
  const weekEnd = new Date(todayDate);
  weekEnd.setUTCDate(weekEnd.getUTCDate() - 1);      // Saturday
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);  // previous Sunday

  const wkStart = weekStart.toISOString().slice(0, 10);
  const wkEnd = weekEnd.toISOString().slice(0, 10);

  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setUTCDate(prevWeekEnd.getUTCDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 6);
  const prevWkStart = prevWeekStart.toISOString().slice(0, 10);
  const prevWkEnd = prevWeekEnd.toISOString().slice(0, 10);

  const verified = onlyVerified(completions);
  const weekVerified = verified.filter(
    (c) => c.completed_date >= wkStart && c.completed_date <= wkEnd,
  );
  const prevWeekVerified = verified.filter(
    (c) => c.completed_date >= prevWkStart && c.completed_date <= prevWkEnd,
  );

  // Day-level tallies
  const dayMap = new Map<string, { chores: number; xp: number }>();
  for (const c of weekVerified) {
    const row = dayMap.get(c.completed_date) ?? { chores: 0, xp: 0 };
    row.chores++;
    row.xp += c.points_earned ?? 0;
    dayMap.set(c.completed_date, row);
  }

  let bestDayDate: string | null = null;
  let bestDayChores = 0;
  let bestDayXP = 0;
  dayMap.forEach((row, date) => {
    if (row.chores > bestDayChores || (row.chores === bestDayChores && row.xp > bestDayXP)) {
      bestDayDate = date;
      bestDayChores = row.chores;
      bestDayXP = row.xp;
    }
  });

  // Top chore: most days completed in the week
  const choreMap = new Map<string, number>();
  for (const c of weekVerified) choreMap.set(c.chore_id, (choreMap.get(c.chore_id) ?? 0) + 1);
  let topChoreId = "";
  let topChoreCount = 0;
  choreMap.forEach((count, id) => {
    if (count > topChoreCount) { topChoreCount = count; topChoreId = id; }
  });
  const topChoreObj = topChoreId ? chores.find((c) => c.id === topChoreId) ?? null : null;

  // How many times was top chore scheduled this week?
  let topChoreScheduled = 0;
  if (topChoreObj) {
    const assignmentByChoreId = new Map<string, ChoreAssignment>();
    for (const a of assignments) assignmentByChoreId.set(a.chore_id, a);
    const cursor = new Date(wkStart + "T00:00:00");
    const endDate = new Date(wkEnd + "T00:00:00");
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const due = scheduledOnDate([topChoreObj], assignmentByChoreId, dateStr, holidays);
      topChoreScheduled += due.length;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // New badges earned this week
  const badgeById = new Map(badges.map((b) => [b.id, b]));
  const newBadgeTitles = userBadges
    .filter((ub) => {
      const d = ub.earned_at.slice(0, 10);
      return d >= wkStart && d <= wkEnd;
    })
    .map((ub) => badgeById.get(ub.badge_id)?.title ?? "Badge")
    .slice(0, 3);

  // Comebacks this week
  const weekDates = Array.from(dayMap.keys()).sort();
  let comebacks = 0;
  for (let i = 1; i < weekDates.length; i++) {
    const gap = daysBetween(weekDates[i - 1]!, weekDates[i]!);
    if (gap >= 2) comebacks++;
  }

  const totalXP = weekVerified.reduce((s, c) => s + (c.points_earned ?? 0), 0);
  const prevTotal = prevWeekVerified.length;
  const percentVsPrev =
    prevTotal > 0
      ? Math.round(((weekVerified.length - prevTotal) / prevTotal) * 100)
      : null;

  return {
    weekStart: wkStart,
    weekEnd: wkEnd,
    totalChores: weekVerified.length,
    totalXP,
    bestDayDate,
    bestDayChores,
    bestDayXP,
    topChoreName: topChoreObj?.title ?? null,
    topChoreIcon: topChoreObj?.icon ?? null,
    topChoreCompleted: topChoreCount,
    topChoreScheduled,
    newBadgeTitles,
    percentVsPrev,
    comebacks,
  };
}

// ============================================================
// Per-child weekly sparkline data (Phase 7b)
// ============================================================

export type SparklinePoint = {
  weekStart: string;
  consistencyPct: number;
};

export function computePerChildSparkline(
  completions: ChoreCompletion[],
  chores: Chore[],
  assignments: ChoreAssignment[],
  today: string,
  weeksBack = 8,
  holidays?: ReadonlySet<string>,
): SparklinePoint[] {
  const points: SparklinePoint[] = [];
  const assignmentByChoreId = new Map<string, ChoreAssignment>();
  for (const a of assignments) assignmentByChoreId.set(a.chore_id, a);

  for (let w = weeksBack - 1; w >= 0; w--) {
    const endDate = new Date(today + "T00:00:00");
    endDate.setDate(endDate.getDate() - endDate.getDay() - 1 - (w * 7)); // last Sat of that week
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    const ws = startDate.toISOString().slice(0, 10);
    const we = endDate.toISOString().slice(0, 10);

    const { verified, scheduled } = consistencyOver([{ completions, chores, assignments, holidays }], ws, we);
    points.push({
      weekStart: ws,
      consistencyPct: scheduled > 0 ? Math.round((verified / scheduled) * 100) : 0,
    });
  }

  return points;
}

// ============================================================
// Chore difficulty stats (Phase 7b)
// ============================================================

export type ChoreDifficultyStats = {
  choreId: string;
  choreName: string;
  choreIcon: string | null;
  completionRate: number;   // verified / scheduled (last N days)
  denialRate: number;       // denied / (denied + verified) — 0 if none
  totalScheduled: number;
  totalCompleted: number;
  isFlagged: boolean;       // completion < 50% or denial > 30%
};

export function computeChoreDifficultyStats(
  chores: Chore[],
  allCompletions: ChoreCompletion[],
  allAssignments: ChoreAssignment[],
  today: string,
  days = 30,
  holidays?: ReadonlySet<string>,
): ChoreDifficultyStats[] {
  const startDate = new Date(today + "T00:00:00");
  startDate.setDate(startDate.getDate() - (days - 1));
  const start = startDate.toISOString().slice(0, 10);

  const assignmentByChoreId = new Map<string, ChoreAssignment>();
  for (const a of allAssignments) assignmentByChoreId.set(a.chore_id, a);

  return chores
    .filter((c) => c.is_active)
    .map((chore) => {
      // Count scheduled days
      let scheduled = 0;
      const cursor = new Date(start + "T00:00:00");
      const endDate = new Date(today + "T00:00:00");
      while (cursor <= endDate) {
        const dateStr = cursor.toISOString().slice(0, 10);
        const due = scheduledOnDate([chore], assignmentByChoreId, dateStr, holidays);
        scheduled += due.length;
        cursor.setDate(cursor.getDate() + 1);
      }

      const relevantCompletions = allCompletions.filter(
        (c) => c.chore_id === chore.id && c.completed_date >= start && c.completed_date <= today,
      );
      const verified = relevantCompletions.filter((c) => c.status === "verified").length;
      const denied = relevantCompletions.filter((c) => c.status === "denied").length;

      const completionRate = scheduled > 0 ? verified / scheduled : 0;
      const denialRate = verified + denied > 0 ? denied / (verified + denied) : 0;
      const isFlagged = (scheduled >= 4 && completionRate < 0.5) || denialRate > 0.3;

      return {
        choreId: chore.id,
        choreName: chore.title,
        choreIcon: chore.icon,
        completionRate,
        denialRate,
        totalScheduled: scheduled,
        totalCompleted: verified,
        isFlagged,
      };
    })
    .filter((s) => s.totalScheduled > 0)
    .sort((a, b) => a.completionRate - b.completionRate);
}

// ============================================================
// Sibling Cup (Phase 7b)
// ============================================================

export type SiblingEntry = {
  kidId: string;
  name: string;
  avatarUrl: string | null;
  weeklyConsistencyPct: number;
  rank: number;
};

export function computeSiblingCup(
  kidsData: Array<{
    profile: Profile;
    completions: ChoreCompletion[];
    chores: Chore[];
    assignments: ChoreAssignment[];
  }>,
  today: string,
): SiblingEntry[] | null {
  if (kidsData.length < 2) return null;

  // This week Sun-Sat (including today)
  const todayDate = new Date(today + "T12:00:00Z");
  const dow = todayDate.getUTCDay();
  const thisSunday = new Date(todayDate);
  thisSunday.setUTCDate(thisSunday.getUTCDate() - dow);
  const wkStart = thisSunday.toISOString().slice(0, 10);

  const entries: Omit<SiblingEntry, "rank">[] = kidsData.map((k) => {
    const { verified, scheduled } = consistencyOver([k], wkStart, today);
    return {
      kidId: k.profile.id,
      name: k.profile.name?.split(" ")[0] ?? "Kid",
      avatarUrl: k.profile.avatar_url,
      weeklyConsistencyPct: scheduled > 0 ? Math.round((verified / scheduled) * 100) : 0,
    };
  });

  entries.sort((a, b) => b.weeklyConsistencyPct - a.weeklyConsistencyPct);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}
