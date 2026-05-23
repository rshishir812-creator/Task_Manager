"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Redemption } from "@/lib/types";

interface RedemptionsPanelProps {
  initialRedemptions: Redemption[];
  kids: Profile[];
  balances: Record<string, { earned: number; spent: number; available: number }>;
}

export default function RedemptionsPanel({ initialRedemptions, kids, balances }: RedemptionsPanelProps) {
  const router = useRouter();
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [acting, setActing] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyNote, setDenyNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const pending = redemptions.filter((r) => r.status === "pending");
  const recent = redemptions.filter((r) => r.status !== "pending").slice(0, 50);

  async function decide(id: string, action: "approve" | "deny", note?: string) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/redemptions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note ?? null }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        showToast(`❌ ${data.error ?? "Failed"}`);
        return;
      }
      const { redemption } = await res.json() as { redemption: Redemption };
      setRedemptions((prev) => prev.map((r) => r.id === redemption.id ? redemption : r));
      showToast(action === "approve" ? "✅ Approved — points deducted" : "🚫 Denied");
      router.refresh();
    } finally {
      setActing(null);
      setDenyingId(null);
      setDenyNote("");
    }
  }

  function kidName(userId: string): string {
    return kids.find((k) => k.id === userId)?.name?.split(" ")[0] ?? "Child";
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-sm text-center">
          {toast}
        </div>
      )}

      {/* Pending */}
      <section>
        <h2 className="font-display font-semibold text-fg mb-2 text-sm uppercase tracking-wide text-fg-muted">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-6 text-center">
            <p className="text-sm text-fg-muted">All caught up! No requests waiting.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((r) => {
              const bal = balances[r.user_id];
              const canAfford = bal ? bal.available >= r.points_cost : true;
              const isDenying = denyingId === r.id;
              return (
                <div key={r.id} className="rounded-2xl border border-accent-amber/40 bg-bg-elevated p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{r.reward_icon ?? "🎁"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-fg">{r.reward_title}</p>
                      <p className="text-xs text-fg-muted mt-0.5">
                        {kidName(r.user_id)} · <span className="text-accent-amber font-semibold">{r.points_cost} pts</span>
                      </p>
                      <p className="text-xs text-fg-muted mt-1">
                        Available: {bal?.available ?? "?"} pts
                        {!canAfford && (
                          <span className="text-red-400 ml-1">· not enough</span>
                        )}
                      </p>
                      <p className="text-xs text-fg-muted mt-0.5">
                        Requested {new Date(r.requested_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>

                  {!isDenying ? (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => decide(r.id, "approve")}
                        disabled={acting === r.id || !canAfford}
                        className="flex-1 rounded-xl bg-accent-teal text-black font-semibold text-sm px-4 py-2 disabled:opacity-50"
                      >
                        {acting === r.id ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => setDenyingId(r.id)}
                        disabled={acting === r.id}
                        className="rounded-xl border border-[var(--border)] text-fg-muted text-sm px-4 py-2 hover:bg-bg"
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
                          onClick={() => decide(r.id, "deny", denyNote)}
                          disabled={acting === r.id}
                          className="flex-1 rounded-xl bg-red-500/20 text-red-400 font-semibold text-sm px-4 py-2"
                        >
                          {acting === r.id ? "…" : "Confirm deny"}
                        </button>
                        <button
                          onClick={() => { setDenyingId(null); setDenyNote(""); }}
                          className="rounded-xl border border-[var(--border)] text-fg-muted text-sm px-4 py-2"
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
        )}
      </section>

      {/* History */}
      {recent.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-2 text-sm uppercase tracking-wide text-fg-muted">
            Recent
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-2xl">{r.reward_icon ?? "🎁"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{r.reward_title}</p>
                  <p className="text-xs text-fg-muted">
                    {kidName(r.user_id)} · {r.points_cost} pts · {new Date(r.decided_at ?? r.requested_at).toLocaleDateString("en-IN")}
                  </p>
                  {r.decided_note && <p className="text-xs text-fg-muted italic mt-0.5">&ldquo;{r.decided_note}&rdquo;</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  r.status === "approved"
                    ? "bg-accent-teal/20 text-accent-teal"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {r.status === "approved" ? "Approved" : "Denied"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
