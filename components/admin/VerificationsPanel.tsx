"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Chore, ChoreCompletion, Profile } from "@/lib/types";
import {
  pointsForRating,
  qualityLevel,
  type QualityRatingValue,
} from "@/lib/quality-rating";
import QualityRating from "@/components/admin/QualityRating";
import VerificationDayGroup from "@/components/admin/VerificationDayGroup";

interface VerificationsPanelProps {
  initialCompletions: ChoreCompletion[];
  kids: Profile[];
  chores: Chore[];
}

function fmtTimeRange(startIso: string | null, endIso: string | null): string {
  if (!startIso || !endIso) return "";
  const s = new Date(startIso);
  const e = new Date(endIso);
  const mins = Math.round((e.getTime() - s.getTime()) / 60000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${fmt(s)} – ${fmt(e)} (${mins} min)`;
}

// Group an array of completions by completed_date, return [date, items][]
// sorted newest date first.
function groupByDate(items: ChoreCompletion[]): [string, ChoreCompletion[]][] {
  const map = new Map<string, ChoreCompletion[]>();
  for (const c of items) {
    const arr = map.get(c.completed_date) ?? [];
    arr.push(c);
    map.set(c.completed_date, arr);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export default function VerificationsPanel({
  initialCompletions,
  kids,
  chores,
}: VerificationsPanelProps) {
  const router = useRouter();
  const [completions, setCompletions] = useState(initialCompletions);
  const [acting, setActing] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyNote, setDenyNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  // Per-pending-card rating picks (not yet committed) keyed by completion.id
  const [pendingRating, setPendingRating] = useState<Record<string, QualityRatingValue | null>>({});
  // Per-kid filter on the pending list ("all" or kidId)
  const [kidFilter, setKidFilter] = useState<string>("all");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const kidById = useMemo(() => new Map(kids.map((k) => [k.id, k])), [kids]);
  const choreById = useMemo(() => new Map(chores.map((c) => [c.id, c])), [chores]);

  const pendingAll = completions.filter((c) => c.status === "pending");
  const pendingPerKid = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of pendingAll) m.set(c.user_id, (m.get(c.user_id) ?? 0) + 1);
    return m;
  }, [pendingAll]);

  const pendingFiltered = pendingAll.filter(
    (c) => kidFilter === "all" || c.user_id === kidFilter,
  );
  const recent = completions
    .filter((c) => c.status !== "pending")
    .slice(0, 80);

  const pendingGroups = groupByDate(pendingFiltered);
  const recentGroups = groupByDate(recent);

  async function decide(id: string, action: "approve" | "deny", note?: string) {
    setActing(id);
    const rating = action === "approve" ? pendingRating[id] ?? null : null;
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note ?? null, rating }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        showToast(`❌ ${data.error ?? "Failed"}`);
        return;
      }
      // Compute the optimistic points for the approve path so the Recent
      // badge is correct without a refetch.
      const completionRow = completions.find((c) => c.id === id);
      const chore = completionRow ? choreById.get(completionRow.chore_id) : null;
      const newPoints =
        action === "approve" && completionRow && chore && !completionRow.is_exception
          ? pointsForRating(chore.points, rating)
          : completionRow?.points_earned ?? null;

      setCompletions((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: action === "approve" ? "verified" : "denied",
                verified_at: new Date().toISOString(),
                denial_reason: action === "deny" ? (note?.trim() || null) : c.denial_reason,
                quality_rating: action === "approve" ? rating : c.quality_rating,
                points_earned: newPoints,
              }
            : c,
        ),
      );
      setPendingRating((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (action === "approve") {
        const meta = qualityLevel(rating);
        showToast(
          meta
            ? `${meta.emoji} Approved · +${newPoints ?? 0} pts (${meta.label})`
            : "✅ Approved — streak bumped",
        );
      } else {
        showToast("🚫 Denied");
      }
      router.refresh();
    } finally {
      setActing(null);
      setDenyingId(null);
      setDenyNote("");
    }
  }

  async function rateRecent(id: string, rating: QualityRatingValue | null) {
    setActing(id);
    const before = completions.find((c) => c.id === id);
    const chore = before ? choreById.get(before.chore_id) : null;
    // Optimistic apply
    const optimisticPoints = chore ? pointsForRating(chore.points, rating) : before?.points_earned ?? 0;
    setCompletions((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, quality_rating: rating, points_earned: optimisticPoints }
          : c,
      ),
    );
    try {
      const res = await fetch("/api/admin/completions/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionId: id, rating }),
      });
      if (!res.ok) {
        // Rollback
        if (before) {
          setCompletions((prev) => prev.map((c) => (c.id === id ? before : c)));
        }
        const data = await res.json() as { error?: string };
        showToast(`❌ ${data.error ?? "Couldn't save rating"}`);
        return;
      }
      const meta = qualityLevel(rating);
      const kidFirst = before ? (kidById.get(before.user_id)?.name?.split(" ")[0] ?? "Child") : "Child";
      showToast(
        meta
          ? `${meta.emoji} ${kidFirst} now earns ${optimisticPoints} pts`
          : `↺ Rating cleared · ${kidFirst} back to full points`,
      );
      router.refresh();
    } finally {
      setActing(null);
    }
  }

  function kidName(userId: string): string {
    const k = kidById.get(userId);
    return k?.name?.split(" ")[0] ?? "Child";
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-sm text-center">
          {toast}
        </div>
      )}

      {/* Header summary strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-accent-amber/20 text-accent-amber font-semibold">
          ⏳ {pendingAll.length} pending
        </span>
        {kidFilter !== "all" && (
          <button
            type="button"
            onClick={() => setKidFilter("all")}
            className="text-[11px] px-2.5 py-1 rounded-full bg-accent-teal/20 text-accent-teal font-semibold flex items-center gap-1 hover:bg-accent-teal/30"
          >
            {kidName(kidFilter)} ✕
          </button>
        )}
      </div>

      {/* Per-kid filter chips */}
      {kids.length >= 2 && (
        <div className="flex items-center gap-1.5 flex-wrap -mt-2">
          <button
            type="button"
            onClick={() => setKidFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              kidFilter === "all"
                ? "border-accent-amber bg-accent-amber/20 text-accent-amber"
                : "border-[var(--border)] text-fg-muted hover:border-accent-amber/60"
            }`}
          >
            All ({pendingAll.length})
          </button>
          {kids.map((k) => {
            const n = pendingPerKid.get(k.id) ?? 0;
            const selected = kidFilter === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKidFilter(selected ? "all" : k.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selected
                    ? "border-accent-amber bg-accent-amber/20 text-accent-amber"
                    : "border-[var(--border)] text-fg-muted hover:border-accent-amber/60"
                }`}
              >
                {kidName(k.id)} ({n})
              </button>
            );
          })}
        </div>
      )}

      {/* Pending */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-fg text-sm uppercase tracking-wide text-fg-muted">
          Pending
        </h2>
        {pendingFiltered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-6 text-center">
            <p className="text-sm text-fg-muted">
              {pendingAll.length === 0
                ? "All caught up! No pending verifications."
                : `No pending items for ${kidName(kidFilter)}.`}
            </p>
          </div>
        ) : (
          pendingGroups.map(([date, items]) => (
            <VerificationDayGroup
              key={`p-${date}`}
              date={date}
              count={items.length}
              tone="amber"
            >
              <div className="flex flex-col gap-2">
                {items.map((c) => {
                  const chore = choreById.get(c.chore_id);
                  if (!chore) return null;
                  const isDenying = denyingId === c.id;
                  const picked = pendingRating[c.id] ?? null;
                  const previewPts = pointsForRating(chore.points, picked);
                  const timeRange = fmtTimeRange(c.self_report_start_at, c.self_report_end_at);
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-accent-amber/40 bg-bg-elevated p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{chore.icon ?? "✅"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-fg">{chore.title}</p>
                          <p className="text-xs text-fg-muted mt-0.5">
                            {kidName(c.user_id)}
                            {timeRange && <> · ⏰ {timeRange}</>}
                          </p>
                          {c.notes && (
                            <div className="mt-2 rounded-lg bg-bg border border-[var(--border)] px-3 py-2">
                              <p className="text-xs text-fg-muted uppercase tracking-wide mb-1">
                                What they did
                              </p>
                              <p className="text-sm text-fg whitespace-pre-wrap">{c.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isDenying && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                          <p className="text-xs text-fg-muted">Rate quality (optional)</p>
                          <QualityRating
                            value={picked}
                            onChange={(v) =>
                              setPendingRating((prev) => ({ ...prev, [c.id]: v }))
                            }
                            disabled={acting === c.id}
                            size="md"
                          />
                        </div>
                      )}

                      {!isDenying ? (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => decide(c.id, "approve")}
                            disabled={acting === c.id}
                            className="flex-1 rounded-xl bg-accent-teal text-black font-semibold text-sm px-4 py-2 disabled:opacity-50 min-h-[44px]"
                          >
                            {acting === c.id ? "…" : `Approve · +${previewPts} pts`}
                          </button>
                          <button
                            onClick={() => setDenyingId(c.id)}
                            disabled={acting === c.id}
                            className="rounded-xl border border-[var(--border)] text-fg-muted text-sm px-4 py-2 hover:bg-bg min-h-[44px]"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 mt-3">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Optional: tell them why"
                            value={denyNote}
                            onChange={(e) => setDenyNote(e.target.value)}
                            className="w-full rounded-xl bg-bg border border-[var(--border)] px-3 py-2 text-sm text-fg"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => decide(c.id, "deny", denyNote)}
                              disabled={acting === c.id}
                              className="flex-1 rounded-xl bg-red-500/20 text-red-400 font-semibold text-sm px-4 py-2 min-h-[44px]"
                            >
                              {acting === c.id ? "…" : "Confirm deny"}
                            </button>
                            <button
                              onClick={() => {
                                setDenyingId(null);
                                setDenyNote("");
                              }}
                              className="rounded-xl border border-[var(--border)] text-fg-muted text-sm px-4 py-2 min-h-[44px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </VerificationDayGroup>
          ))
        )}
      </section>

      {/* Recent */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-fg text-sm uppercase tracking-wide text-fg-muted">
          Recent
        </h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-6 text-center">
            <p className="text-sm text-fg-muted">
              Decisions you make will show up here, grouped by day.
            </p>
          </div>
        ) : (
          recentGroups.map(([date, items]) => (
            <VerificationDayGroup key={`r-${date}`} date={date} count={items.length}>
              <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
                {items.map((c) => {
                  const chore = choreById.get(c.chore_id);
                  if (!chore) return null;
                  const rateable = c.status === "verified" && !c.is_exception;
                  const meta = qualityLevel(c.quality_rating);
                  const earned = c.points_earned ?? 0;
                  return (
                    <div key={c.id} className="flex flex-col gap-2 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{chore.icon ?? "✅"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-fg truncate">{chore.title}</p>
                          <p className="text-xs text-fg-muted">{kidName(c.user_id)}</p>
                          {c.denial_reason && c.status === "denied" && (
                            <p className="text-xs text-fg-muted italic mt-0.5">
                              &ldquo;{c.denial_reason}&rdquo;
                            </p>
                          )}
                        </div>
                        {c.is_exception ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-accent-amber/20 text-accent-amber">
                            ⚡ Exception
                          </span>
                        ) : c.status === "verified" ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-accent-teal/20 text-accent-teal whitespace-nowrap">
                            {meta?.emoji ?? ""} {earned} / {chore.points} pts
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                            Denied
                          </span>
                        )}
                      </div>
                      {rateable && (
                        <div className="flex items-center gap-2 pl-9">
                          <QualityRating
                            value={c.quality_rating}
                            onChange={(v) => rateRecent(c.id, v)}
                            disabled={acting === c.id}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </VerificationDayGroup>
          ))
        )}
      </section>
    </div>
  );
}
