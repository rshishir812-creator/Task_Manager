"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Override {
  id: string;
  points_bonus: number;
  awarded_at: string;
}

interface PointsOverridePanelProps {
  userId: string;
  userName: string;
  totalPoints: number;
  initialOverrides: Override[];
}

export default function PointsOverridePanel({
  userId,
  userName,
  totalPoints,
  initialOverrides,
}: PointsOverridePanelProps) {
  const router = useRouter();
  const [overrides, setOverrides] = useState(initialOverrides);
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (points === 0 || !reason.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, points, reason: reason.trim() }),
      });
      if (!res.ok) throw new Error();
      showToast(`${points > 0 ? "+" : ""}${points} pts awarded to ${userName}`);
      setOverrides((prev) => [
        { id: crypto.randomUUID(), points_bonus: points, awarded_at: new Date().toISOString() },
        ...prev,
      ]);
      setPoints(0);
      setReason("");
      router.refresh();
    } catch {
      showToast("❌ Failed to apply override");
    } finally {
      setSaving(false);
    }
  }

  const overrideTotal = overrides.reduce((s, o) => s + o.points_bonus, 0);

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Current total */}
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-fg-muted uppercase tracking-wide mb-1">{userName}&apos;s Total Points</p>
          <p className="font-display font-bold text-3xl text-accent-amber">{totalPoints.toLocaleString()}</p>
        </div>
        {overrideTotal !== 0 && (
          <div className="text-right">
            <p className="text-xs text-fg-muted">From overrides</p>
            <p className={`font-display font-bold text-xl ${overrideTotal > 0 ? "text-accent-teal" : "text-red-400"}`}>
              {overrideTotal > 0 ? "+" : ""}{overrideTotal}
            </p>
          </div>
        )}
      </div>

      {/* Override form */}
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-5">
        <h2 className="font-display font-semibold text-fg mb-4">Add Override</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Points input */}
          <div>
            <label className="block text-sm font-semibold text-fg mb-1.5">Points (positive = bonus, negative = deduction)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPoints((p) => p - 5)}
                className="w-10 h-10 rounded-xl border border-[var(--border)] bg-bg text-lg font-bold text-fg hover:bg-bg-elevated transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                className="w-24 text-center rounded-xl border border-[var(--border)] bg-bg px-3 py-2 font-display font-bold text-xl text-fg focus:outline-none focus:ring-2 focus:ring-accent-amber"
              />
              <button
                type="button"
                onClick={() => setPoints((p) => p + 5)}
                className="w-10 h-10 rounded-xl border border-[var(--border)] bg-bg text-lg font-bold text-fg hover:bg-bg-elevated transition-colors"
              >
                +
              </button>
              <div className="flex gap-2 ml-2">
                {[10, 25, 50].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPoints(v)}
                    className="text-xs px-2 py-1 rounded-lg bg-accent-teal/20 text-accent-teal hover:bg-accent-teal/40 transition-colors"
                  >
                    +{v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-fg mb-1.5">Reason *</label>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-bg px-3 py-2.5 text-sm text-fg placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-amber"
              placeholder="e.g. Extra effort today! Great job on the presentation."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving || points === 0 || !reason.trim()}
            className="rounded-xl bg-accent-amber text-black font-semibold px-4 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving…" : `Apply ${points > 0 ? "+" : ""}${points} pts`}
          </button>
        </form>
      </div>

      {/* Override history */}
      {overrides.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
          <p className="px-4 py-2.5 text-xs font-semibold text-fg-muted border-b border-[var(--border)] uppercase tracking-wide">
            Override History
          </p>
          <div className="divide-y divide-[var(--border)]">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className={`font-semibold text-sm ${o.points_bonus > 0 ? "text-accent-teal" : "text-red-400"}`}>
                    {o.points_bonus > 0 ? "+" : ""}{o.points_bonus} pts
                  </p>
                  <p className="text-xs text-fg-muted">
                    {new Date(o.awarded_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
