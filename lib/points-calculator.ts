import { LEVEL_THRESHOLDS } from "./constants";

export function getLevelInfo(totalPoints: number) {
  const entry =
    [...LEVEL_THRESHOLDS].reverse().find((l) => totalPoints >= l.min) ??
    LEVEL_THRESHOLDS[0];
  const nextEntry =
    LEVEL_THRESHOLDS.find((l) => l.level === entry.level + 1) ?? null;

  const xpIntoLevel = totalPoints - entry.min;
  const xpForLevel = nextEntry ? nextEntry.min - entry.min : 1;
  const progress = Math.min(xpIntoLevel / xpForLevel, 1);

  return {
    level: entry.level,
    name: entry.name,
    xpIntoLevel,
    xpForLevel,
    progress,
    pointsToNext: nextEntry ? nextEntry.min - totalPoints : 0,
    isMaxLevel: !nextEntry,
  };
}
