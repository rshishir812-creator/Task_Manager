"use client";

import { useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { Chore, ChoreCompletion } from "@/lib/types";
import StreakFlame from "@/components/gamification/StreakFlame";
import ExceptionModal from "@/components/gamification/ExceptionModal";
import ConfettiBlast from "@/components/gamification/ConfettiBlast";

interface ChoreCardProps {
  chore: Chore;
  completion?: ChoreCompletion;
  streak: number;
  date: string;
  index?: number;
  onComplete: (choreId: string, date: string) => Promise<void>;
  onUncomplete: (choreId: string, date: string) => Promise<void>;
  onException: (choreId: string, date: string, reason: string) => Promise<void>;
}

const SWIPE_THRESHOLD = 80;

export default function ChoreCard({
  chore,
  completion,
  streak,
  date,
  index = 0,
  onComplete,
  onUncomplete,
  onException,
}: ChoreCardProps) {
  const [loading, setLoading] = useState(false);
  const [showException, setShowException] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const swipeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const exceptionOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const isDone = !!completion && !completion.is_exception;
  const isException = !!completion?.is_exception;

  const handleCheck = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) return;
      if (isDone) {
        setLoading(true);
        try { await onUncomplete(chore.id, date); } finally { setLoading(false); }
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      setConfettiOrigin({
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      });
      setLoading(true);
      try {
        await onComplete(chore.id, date);
        setShowConfetti(true);
      } finally {
        setLoading(false);
      }
    },
    [loading, isDone, chore.id, date, onComplete, onUncomplete]
  );

  const handleException = useCallback(
    async (reason: string) => {
      setShowException(false);
      setLoading(true);
      try { await onException(chore.id, date, reason); } finally { setLoading(false); }
    },
    [chore.id, date, onException]
  );

  const handleDragEnd = useCallback(
    async (_: unknown, info: { offset: { x: number } }) => {
      const ox = info.offset.x;
      // Snap back
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });

      if (loading || isDone || isException) return;

      if (ox >= SWIPE_THRESHOLD) {
        // Swipe right → complete
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) {
          setConfettiOrigin({
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          });
        }
        setLoading(true);
        try {
          await onComplete(chore.id, date);
          setShowConfetti(true);
        } finally {
          setLoading(false);
        }
      } else if (ox <= -SWIPE_THRESHOLD) {
        // Swipe left → open exception modal
        setShowException(true);
      }
    },
    [loading, isDone, isException, chore.id, date, onComplete, x]
  );

  const cardClass = isDone
    ? "border-accent-teal bg-bg-elevated shadow-[0_0_12px_rgba(0,229,255,0.2)]"
    : isException
    ? "border-accent-amber bg-bg-elevated"
    : "border-[var(--border)] bg-bg-elevated hover:border-[var(--fg-muted)]";

  return (
    <>
      {showConfetti && (
        <ConfettiBlast
          originX={confettiOrigin.x}
          originY={confettiOrigin.y}
          particleCount={60}
          onDone={() => setShowConfetti(false)}
        />
      )}

      {showException && (
        <ExceptionModal
          choreName={chore.title}
          onConfirm={handleException}
          onCancel={() => setShowException(false)}
        />
      )}

      {/* Entrance animation wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: index * 0.06, ease: "easeOut" }}
        className="relative"
      >
        {/* Swipe hint backgrounds */}
        <div className="absolute inset-0 rounded-2xl flex items-center overflow-hidden pointer-events-none">
          {/* Right swipe = complete */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-accent-teal/20 flex items-center pl-5"
            style={{ opacity: swipeOpacity }}
          >
            <span className="text-2xl">✅</span>
          </motion.div>
          {/* Left swipe = exception */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-accent-amber/20 flex items-center justify-end pr-5"
            style={{ opacity: exceptionOpacity }}
          >
            <span className="text-2xl">⚡</span>
          </motion.div>
        </div>

        {/* Draggable card */}
        <motion.div
          ref={cardRef}
          drag={!isDone && !isException ? "x" : false}
          dragConstraints={{ left: -120, right: 120 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`relative rounded-2xl border p-4 transition-colors duration-200 cursor-grab active:cursor-grabbing touch-pan-y ${cardClass}`}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span
                className={`text-3xl flex-shrink-0 transition-transform duration-200 ${
                  isDone ? "scale-110" : ""
                }`}
              >
                {chore.icon ?? "✅"}
              </span>
              <div className="min-w-0">
                <p
                  className={`font-display font-semibold text-sm leading-tight ${
                    isDone ? "line-through text-fg-muted" : "text-fg"
                  }`}
                >
                  {chore.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-accent-amber">
                    +{chore.points} pts
                  </span>
                  {streak > 0 && <StreakFlame streak={streak} size="sm" />}
                </div>
              </div>
            </div>

            {/* Complete button */}
            <button
              onClick={handleCheck}
              disabled={loading || isException}
              aria-label={isDone ? "Mark incomplete" : "Mark complete"}
              className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-teal ${
                isDone
                  ? "bg-accent-teal border-accent-teal text-black"
                  : isException
                  ? "border-accent-amber bg-accent-amber/20 text-accent-amber cursor-default"
                  : "border-[var(--border)] text-fg-muted hover:border-accent-teal hover:text-accent-teal"
              } ${loading ? "opacity-50" : ""}`}
            >
              {isException ? (
                <span className="text-base">⚡</span>
              ) : isDone ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-3 h-3 rounded-full bg-current opacity-30" />
              )}
            </button>
          </div>

          {/* Exception button */}
          {!isDone && !isException && (
            <button
              onClick={() => setShowException(true)}
              className="mt-3 text-xs text-fg-muted hover:text-accent-amber transition-colors"
            >
              ⚡ Can&apos;t do it today? Mark exception
            </button>
          )}

          {isException && completion?.exception_reason && (
            <p className="mt-2 text-xs text-accent-amber italic">
              &quot;{completion.exception_reason}&quot;
            </p>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
