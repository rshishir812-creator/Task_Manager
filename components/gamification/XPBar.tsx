"use client";

import { motion } from "framer-motion";
import { getLevelInfo } from "@/lib/points-calculator";

interface XPBarProps {
  totalPoints: number;
}

export default function XPBar({ totalPoints }: XPBarProps) {
  const info = getLevelInfo(totalPoints);
  const pct = info.progress * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="font-display font-bold text-accent-amber text-sm">
          Lv.{info.level} {info.name}
        </span>
        <span className="text-xs text-fg-muted">
          {info.isMaxLevel
            ? `${totalPoints.toLocaleString()} pts`
            : `${info.xpIntoLevel} / ${info.xpForLevel} XP`}
        </span>
      </div>
      <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--accent-teal), var(--accent-amber))",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {!info.isMaxLevel && (
        <p className="text-xs text-fg-muted mt-1 text-right">
          {info.pointsToNext} pts to next level
        </p>
      )}
    </div>
  );
}
