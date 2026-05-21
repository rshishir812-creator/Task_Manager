"use client";

import { useState, useCallback, useRef, useMemo } from "react";
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
  onComplete: (
    choreId: string,
    date: string,
    payload?: { startAt?: string; endAt?: string; notes?: string },
  ) => Promise<void>;
  onUncomplete: (choreId: string, date: string) => Promise<void>;
  onException: (choreId: string, date: string, reason: string) => Promise<void>;
}

const SWIPE_THRESHOLD = 80;

// Current IST time as "HH:MM"
function currentIstHHMM(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(11, 16);
}

// Default a time input to "now − minutes" in HH:MM (IST)
function nowMinusMinutes(minutes: number): string {
  const d = new Date(Date.now() - minutes * 60 * 1000 + 5.5 * 60 * 60 * 1000);
  return d.toISOString().slice(11, 16);
}

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
  const [showSelfReport, setShowSelfReport] = useState(false);
  const [startAt, setStartAt] = useState(() => nowMinusMinutes(15));
  const [endAt, setEndAt] = useState(() => currentIstHHMM());
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const swipeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const exceptionOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  // Derive verification state — completion.status is the source of truth.
  const status = completion?.status ?? null;
  const isVerified = status === "verified" && !completion?.is_exception;
  const isPending = status === "pending" && !completion?.is_exception;
  const isDenied = status === "denied";
  const isException = !!completion?.is_exception;

  // "Done" = verified non-exception completion (treat the card like done).
  const isDone = isVerified;

  // Verification mode flags
  const needsApproval = !!chore.requires_parent_approval;
  const needsSelfReport = !!chore.requires_self_report;
  const hasWindow = !!chore.window_start_time && !!chore.window_end_time;

  // Window state — only matters for today's view. If outside, lock interactions.
  const windowState = useMemo(() => {
    if (!hasWindow) return { locked: false, label: "" };
    const now = currentIstHHMM();
    const start = chore.window_start_time!.slice(0, 5);
    const end = chore.window_end_time!.slice(0, 5);
    const locked = now < start || now > end;
    return { locked, label: `${start}–${end}` };
  }, [hasWindow, chore.window_start_time, chore.window_end_time]);

  // Submit (honor + approval-only path — no self-report payload)
  const submitSimple = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onComplete(chore.id, date);
      if (!needsApproval) setShowConfetti(true);
    } finally {
      setLoading(false);
    }
  }, [loading, chore.id, date, onComplete, needsApproval]);

  // Submit self-report payload
  const submitSelfReport = useCallback(async () => {
    setFormError(null);
    const note = notes.trim();
    if (note.length < 5) {
      setFormError("Tell us what you did (5+ chars).");
      return;
    }
    if (!startAt || !endAt) {
      setFormError("Pick a start and end time.");
      return;
    }
    if (endAt <= startAt) {
      setFormError("End time must be after start time.");
      return;
    }
    // Convert HH:MM + date into ISO timestamps (local browser tz)
    const startIso = new Date(`${date}T${startAt}:00`).toISOString();
    const endIso = new Date(`${date}T${endAt}:00`).toISOString();
    setLoading(true);
    try {
      await onComplete(chore.id, date, { startAt: startIso, endAt: endIso, notes: note });
      setShowSelfReport(false);
      setNotes("");
    } finally {
      setLoading(false);
    }
  }, [notes, startAt, endAt, date, chore.id, onComplete]);

  const handleCheck = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) return;
      if (isDone) {
        setLoading(true);
        try { await onUncomplete(chore.id, date); } finally { setLoading(false); }
        return;
      }
      if (windowState.locked) return;
      if (needsSelfReport) {
        setShowSelfReport(true);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      setConfettiOrigin({
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      });
      await submitSimple();
    },
    [loading, isDone, chore.id, date, onUncomplete, windowState.locked, needsSelfReport, submitSimple]
  );

  const handleException = useCallback(
    async (reason: string) => {
      setShowException(false);
      setLoading(true);
      try { await onException(chore.id, date, reason); } finally { setLoading(false); }
    },
    [chore.id, date, onException]
  );

  // Drag is disabled when the chore needs self-report (form is the action),
  // when locked outside the window, or when the row is in a terminal state.
  const dragEnabled = !isDone && !isException && !isPending && !needsSelfReport && !windowState.locked;

  const handleDragEnd = useCallback(
    async (_: unknown, info: { offset: { x: number } }) => {
      const ox = info.offset.x;
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      if (!dragEnabled || loading) return;

      if (ox >= SWIPE_THRESHOLD) {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) {
          setConfettiOrigin({
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          });
        }
        await submitSimple();
      } else if (ox <= -SWIPE_THRESHOLD) {
        setShowException(true);
      }
    },
    [dragEnabled, loading, x, submitSimple]
  );

  // Visual variants
  const cardClass = isDone
    ? "border-accent-teal bg-bg-elevated shadow-[0_0_12px_rgba(0,229,255,0.2)]"
    : isPending
    ? "border-accent-amber/60 bg-bg-elevated"
    : isDenied
    ? "border-red-500/40 bg-bg-elevated"
    : isException
    ? "border-accent-amber bg-bg-elevated"
    : windowState.locked
    ? "border-[var(--border)] bg-bg-elevated opacity-70"
    : "border-[var(--border)] bg-bg-elevated hover:border-[var(--fg-muted)]";

  // Action button content — varies by mode + state
  function renderActionButton() {
    if (isException) {
      return <span className="text-base">⚡</span>;
    }
    if (isDone) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (isPending) {
      return <span className="text-base">⏳</span>;
    }
    if (windowState.locked) {
      return <span className="text-base">🔒</span>;
    }
    if (needsSelfReport) {
      return <span className="text-base">📝</span>;
    }
    if (needsApproval) {
      return <span className="text-base">📩</span>;
    }
    return <span className="w-3 h-3 rounded-full bg-current opacity-30" />;
  }

  function actionAriaLabel() {
    if (isDone) return "Mark incomplete";
    if (isPending) return "Waiting for parent";
    if (windowState.locked) return `Available ${windowState.label}`;
    if (needsSelfReport) return "Submit with details";
    if (needsApproval) return "Submit for approval";
    return "Mark complete";
  }

  // Action button color/border variant
  const actionBtnClass = isDone
    ? "bg-accent-teal border-accent-teal text-black"
    : isException
    ? "border-accent-amber bg-accent-amber/20 text-accent-amber cursor-default"
    : isPending
    ? "border-accent-amber/60 bg-accent-amber/10 text-accent-amber"
    : isDenied
    ? "border-red-500/50 text-red-400"
    : windowState.locked
    ? "border-[var(--border)] text-fg-muted cursor-not-allowed"
    : needsSelfReport || needsApproval
    ? "border-accent-amber/40 text-accent-amber hover:bg-accent-amber/10"
    : "border-[var(--border)] text-fg-muted hover:border-accent-teal hover:text-accent-teal";

  const buttonDisabled = loading || isException || isPending || windowState.locked;

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
        {dragEnabled && (
          <div className="absolute inset-0 rounded-2xl flex items-center overflow-hidden pointer-events-none">
            <motion.div
              className="absolute inset-0 rounded-2xl bg-accent-teal/20 flex items-center pl-5"
              style={{ opacity: swipeOpacity }}
            >
              <span className="text-2xl">✅</span>
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-2xl bg-accent-amber/20 flex items-center justify-end pr-5"
              style={{ opacity: exceptionOpacity }}
            >
              <span className="text-2xl">⚡</span>
            </motion.div>
          </div>
        )}

        {/* Card */}
        <motion.div
          ref={cardRef}
          drag={dragEnabled ? "x" : false}
          dragConstraints={{ left: -120, right: 120 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`relative rounded-2xl border p-4 transition-colors duration-200 ${
            dragEnabled ? "cursor-grab active:cursor-grabbing touch-pan-y" : ""
          } ${cardClass}`}
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
              <div className="min-w-0 flex-1">
                <p
                  className={`font-display font-semibold text-sm leading-tight ${
                    isDone ? "line-through text-fg-muted" : "text-fg"
                  }`}
                >
                  {chore.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-semibold text-accent-amber">
                    +{chore.points} pts
                  </span>
                  {streak > 0 && <StreakFlame streak={streak} size="sm" />}
                  {/* Verification chips */}
                  {!isDone && !isPending && !isDenied && (
                    <>
                      {needsSelfReport && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber">
                          📝 self-report
                        </span>
                      )}
                      {needsApproval && !needsSelfReport && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber">
                          📩 needs approval
                        </span>
                      )}
                      {hasWindow && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          windowState.locked
                            ? "bg-[var(--border)] text-fg-muted"
                            : "bg-accent-teal/15 text-accent-teal"
                        }`}>
                          🕐 {windowState.label}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleCheck}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={buttonDisabled}
              aria-label={actionAriaLabel()}
              title={windowState.locked ? `Available ${windowState.label}` : undefined}
              className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-teal ${actionBtnClass} ${loading ? "opacity-50" : ""}`}
            >
              {renderActionButton()}
            </button>
          </div>

          {/* Self-report inline form */}
          {showSelfReport && !isDone && !isPending && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-fg-muted w-12">Start</label>
                <input
                  type="time"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="rounded-lg bg-bg border border-[var(--border)] px-2 py-1 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent-teal"
                />
                <label className="text-xs text-fg-muted ml-2">End</label>
                <input
                  type="time"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="rounded-lg bg-bg border border-[var(--border)] px-2 py-1 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent-teal"
                />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="What did you do? e.g. read pages 45-72 about the dragon"
                rows={2}
                className="w-full rounded-lg bg-bg border border-[var(--border)] px-2 py-1.5 text-sm text-fg placeholder-fg-muted/60 focus:outline-none focus:ring-1 focus:ring-accent-teal resize-none"
              />
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={submitSelfReport}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-accent-teal text-black font-semibold text-xs py-2 disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Submit for parent"}
                </button>
                <button
                  onClick={() => { setShowSelfReport(false); setFormError(null); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="rounded-xl border border-[var(--border)] text-fg-muted text-xs px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Pending state */}
          {isPending && (
            <div className="mt-3 pt-3 border-t border-accent-amber/30 flex flex-col gap-1">
              <p className="text-xs text-accent-amber font-semibold">⏳ Waiting for parent to approve</p>
              {completion?.notes && (
                <p className="text-xs text-fg-muted italic">&ldquo;{completion.notes}&rdquo;</p>
              )}
            </div>
          )}

          {/* Denied state */}
          {isDenied && (
            <div className="mt-3 pt-3 border-t border-red-500/30 flex flex-col gap-2">
              <p className="text-xs text-red-400 font-semibold">❌ Not approved</p>
              {completion?.denial_reason && (
                <p className="text-xs text-fg-muted italic">&ldquo;{completion.denial_reason}&rdquo;</p>
              )}
              <button
                onClick={() => {
                  if (needsSelfReport) {
                    setShowSelfReport(true);
                  } else {
                    void submitSimple();
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="self-start text-xs text-accent-teal hover:underline"
              >
                Try again →
              </button>
            </div>
          )}

          {/* Exception button (only honor / window-open chores) */}
          {!isDone && !isException && !isPending && !isDenied && !showSelfReport && !windowState.locked && (
            <button
              onClick={() => setShowException(true)}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-3 text-xs text-fg-muted hover:text-accent-amber transition-colors"
            >
              ⚡ Can&apos;t do it today? Mark exception
            </button>
          )}

          {/* Window locked helper */}
          {windowState.locked && !isDone && !isPending && !isDenied && !isException && (
            <p className="mt-2 text-xs text-fg-muted">
              🔒 Available between {windowState.label} (IST)
            </p>
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
