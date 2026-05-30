export type QualityRatingValue = 1 | 2 | 3 | 4;

export interface QualityLevel {
  rating: QualityRatingValue;
  emoji: string;
  label: string;
  factor: number;
}

// Order is highest → lowest so the picker reads left-to-right as
// 🤩 🙂 😐 😞.
export const QUALITY_LEVELS: readonly QualityLevel[] = [
  { rating: 4, emoji: "🤩", label: "Excellent",  factor: 1.0  },
  { rating: 3, emoji: "🙂", label: "Good",       factor: 0.8  },
  { rating: 2, emoji: "😐", label: "Okay",       factor: 0.5  },
  { rating: 1, emoji: "😞", label: "Needs work", factor: 0.25 },
];

export function qualityLevel(rating: number | null | undefined): QualityLevel | null {
  if (rating == null) return null;
  return QUALITY_LEVELS.find((l) => l.rating === rating) ?? null;
}

export function ratingFactor(rating: number | null | undefined): number {
  return qualityLevel(rating)?.factor ?? 1;
}

export function pointsForRating(basePoints: number, rating: number | null | undefined): number {
  return Math.max(0, Math.round(basePoints * ratingFactor(rating)));
}

export function isValidQualityRating(v: unknown): v is QualityRatingValue {
  return v === 1 || v === 2 || v === 3 || v === 4;
}
