"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Badge, UserBadge } from "@/lib/types";

interface BadgeAdminPanelProps {
  badges: Badge[];
  userBadges: UserBadge[];
  userId: string;
}

export default function BadgeAdminPanel({ badges, userBadges, userId }: BadgeAdminPanelProps) {
  const router = useRouter();
  const [earnedMap, setEarnedMap] = useState(
    new Map(userBadges.map((ub) => [ub.badge_id, ub]))
  );
  const [awarding, setAwarding] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "earned" | "unearned">("all");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function award(badge: Badge) {
    setAwarding(badge.id);
    try {
      const res = await fetch("/api/admin/badges/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, badgeId: badge.id }),
      });
      if (res.status === 409) { showToast("Already earned"); return; }
      if (!res.ok) throw new Error();
      const { userBadge } = await res.json() as { userBadge: UserBadge };
      setEarnedMap((prev) => new Map(prev).set(badge.id, userBadge));
      showToast(`🏅 Awarded: ${badge.title}`);
      router.refresh();
    } catch {
      showToast("❌ Failed to award badge");
    } finally {
      setAwarding(null);
    }
  }

  async function revoke(badge: Badge) {
    setRevoking(badge.id);
    setConfirmRevoke(null);
    try {
      const res = await fetch("/api/admin/badges/award", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, badgeId: badge.id }),
      });
      if (!res.ok) throw new Error();
      setEarnedMap((prev) => {
        const next = new Map(prev);
        next.delete(badge.id);
        return next;
      });
      showToast(`🗑️ Revoked: ${badge.title}`);
      router.refresh();
    } catch {
      showToast("❌ Failed to revoke badge");
    } finally {
      setRevoking(null);
    }
  }

  const grouped = {
    special: badges.filter((b) => b.badge_type === "special"),
    overall: badges.filter((b) => b.badge_type === "streak" && b.chore_id === null),
    perchore: badges.filter((b) => b.badge_type === "streak" && b.chore_id !== null),
    award: badges.filter((b) => b.badge_type === "milestone"),
  };

  function BadgeRow({ badge }: { badge: Badge }) {
    const earned = earnedMap.get(badge.id);
    if (filter === "earned" && !earned) return null;
    if (filter === "unearned" && earned) return null;
    const isConfirming = confirmRevoke === badge.id;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`text-2xl ${earned ? "" : "grayscale opacity-60"}`}>
          {badge.icon ?? "🏅"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg truncate">{badge.title}</p>
          {earned ? (
            <p className="text-xs text-accent-teal">
              Earned {new Date(earned.earned_at).toLocaleDateString("en-IN")}
            </p>
          ) : (
            <p className="text-xs text-fg-muted">
              {badge.badge_type === "milestone" && badge.threshold
                ? `${badge.threshold} total completions`
                : badge.threshold
                ? `${badge.threshold}-day streak`
                : "Special"}
            </p>
          )}
        </div>
        {!earned && (
          <button
            onClick={() => award(badge)}
            disabled={awarding === badge.id}
            className="text-xs bg-accent-amber/20 text-accent-amber px-3 py-1 rounded-full hover:bg-accent-amber/40 transition-colors disabled:opacity-50"
          >
            {awarding === badge.id ? "…" : "Award"}
          </button>
        )}
        {earned && (
          <div className="flex items-center gap-2">
            {isConfirming ? (
              <>
                <button
                  onClick={() => revoke(badge)}
                  disabled={revoking === badge.id}
                  className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full hover:bg-red-500/40 transition-colors disabled:opacity-50"
                >
                  {revoking === badge.id ? "…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmRevoke(null)}
                  className="text-xs text-fg-muted hover:text-fg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-xs text-accent-teal">✓ Earned</span>
                <button
                  onClick={() => setConfirmRevoke(badge.id)}
                  className="text-xs text-fg-muted hover:text-red-400 transition-colors ml-1"
                >
                  Revoke
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const earnedCount = earnedMap.size;

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Stats + filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-muted">{earnedCount} / {badges.length} earned</p>
        <div className="flex gap-1">
          {(["all","earned","unearned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-accent-amber text-black"
                  : "bg-bg-elevated border border-[var(--border)] text-fg-muted hover:text-fg"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Special badges */}
      {grouped.special.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
          <p className="px-4 py-2.5 text-xs font-semibold text-fg-muted border-b border-[var(--border)] uppercase tracking-wide">
            ✨ Special
          </p>
          {grouped.special.map((b) => <BadgeRow key={b.id} badge={b} />)}
        </div>
      )}

      {/* Overall streak badges */}
      {grouped.overall.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
          <p className="px-4 py-2.5 text-xs font-semibold text-fg-muted border-b border-[var(--border)] uppercase tracking-wide">
            🔥 Daily Streak
          </p>
          {grouped.overall.map((b) => <BadgeRow key={b.id} badge={b} />)}
        </div>
      )}

      {/* Per-chore streak badges */}
      {grouped.perchore.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
          <p className="px-4 py-2.5 text-xs font-semibold text-fg-muted border-b border-[var(--border)] uppercase tracking-wide">
            🎯 Per-Chore Streaks
          </p>
          <div className="divide-y divide-[var(--border)]">
            {grouped.perchore.map((b) => <BadgeRow key={b.id} badge={b} />)}
          </div>
        </div>
      )}

      {/* Award badges (cumulative milestones) */}
      {grouped.award.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
          <p className="px-4 py-2.5 text-xs font-semibold text-fg-muted border-b border-[var(--border)] uppercase tracking-wide">
            🏆 Awards
          </p>
          <div className="divide-y divide-[var(--border)]">
            {grouped.award.map((b) => <BadgeRow key={b.id} badge={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}
