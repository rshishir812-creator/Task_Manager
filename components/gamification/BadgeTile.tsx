"use client";

import { useState } from "react";
import type { Badge, UserBadge } from "@/lib/types";

interface BadgeTileProps {
  badge: Badge;
  userBadge?: UserBadge;
  progress?: number; // 0–1 for locked badges
}

export default function BadgeTile({ badge, userBadge, progress }: BadgeTileProps) {
  const [showDetail, setShowDetail] = useState(false);
  const earned = !!userBadge;

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
          earned
            ? "border-accent-amber bg-bg-elevated shadow-[0_0_12px_var(--accent-amber)]/30 hover:shadow-[0_0_20px_var(--accent-amber)]/50"
            : "border-[var(--border)] bg-bg opacity-60 hover:opacity-80"
        }`}
        aria-label={badge.title}
      >
        <span
          className={`text-3xl transition-transform duration-200 group-hover:scale-110 ${
            earned ? "" : "grayscale"
          }`}
        >
          {badge.icon ?? "🏅"}
        </span>
        <span className="font-display font-semibold text-xs text-center text-fg leading-tight line-clamp-2">
          {badge.title}
        </span>
        {!earned && typeof progress === "number" && progress > 0 && (
          <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-accent-teal"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        )}
        {earned && (
          <span className="absolute top-2 right-2 text-xs">✓</span>
        )}
      </button>

      {showDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowDetail(false)}
        >
          <div className="bg-bg-elevated rounded-2xl border border-[var(--border)] p-6 w-full max-w-xs shadow-xl text-center">
            <span
              className={`text-5xl block mb-3 ${earned ? "" : "grayscale opacity-60"}`}
              style={earned ? { filter: "drop-shadow(0 0 12px #FFB347)" } : {}}
            >
              {badge.icon ?? "🏅"}
            </span>
            <h2 className="font-display font-bold text-lg text-fg">{badge.title}</h2>
            {badge.description && (
              <p className="text-sm text-fg-muted mt-2">{badge.description}</p>
            )}
            {earned && userBadge && (
              <p className="text-xs text-accent-teal mt-3">
                Earned {new Date(userBadge.earned_at).toLocaleDateString()}
              </p>
            )}
            {!earned && badge.threshold !== null && (
              <p className="text-xs text-fg-muted mt-3">
                Requires {badge.threshold}-day streak
              </p>
            )}
            <button
              onClick={() => setShowDetail(false)}
              className="mt-4 text-sm text-fg-muted hover:text-fg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
