"use client";

import { QUALITY_LEVELS, type QualityRatingValue } from "@/lib/quality-rating";

interface QualityRatingProps {
  value: number | null;
  onChange: (rating: QualityRatingValue | null) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function QualityRating({
  value,
  onChange,
  size = "md",
  disabled = false,
}: QualityRatingProps) {
  const dim = size === "sm" ? "w-9 h-9 text-lg" : "w-11 h-11 text-2xl";

  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Quality rating">
      {QUALITY_LEVELS.map((lvl) => {
        const selected = value === lvl.rating;
        const handleClick = () => {
          if (disabled) return;
          onChange(selected ? null : lvl.rating);
        };
        return (
          <button
            key={lvl.rating}
            type="button"
            onClick={handleClick}
            disabled={disabled}
            aria-pressed={selected}
            aria-label={lvl.label}
            title={lvl.label}
            className={`${dim} rounded-xl border flex items-center justify-center transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent-teal disabled:opacity-50 ${
              selected
                ? "border-accent-amber bg-accent-amber/20 scale-110"
                : "border-[var(--border)] bg-bg hover:border-accent-amber/60"
            }`}
          >
            <span>{lvl.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
