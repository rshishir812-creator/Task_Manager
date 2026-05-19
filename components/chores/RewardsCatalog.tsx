"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Reward, Redemption } from "@/lib/types";

interface RewardsCatalogProps {
  rewards: Reward[];
  redemptions: Redemption[];
  balance: { earned: number; spent: number; available: number };
}

export default function RewardsCatalog({
  rewards,
  redemptions: initialRedemptions,
  balance,
}: RewardsCatalogProps) {
  const router = useRouter();
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // Live reserved-for-pending — recompute as the user redeems
  const livePending = redemptions
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.points_cost, 0);
  const spendable = Math.max(0, balance.available - livePending);

  async function handleRedeem(reward: Reward) {
    if (reward.points_cost > spendable) {
      showToast(`Need ${reward.points_cost - spendable} more points`);
      return;
    }
    setRequesting(reward.id);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        showToast(`❌ ${data.error ?? "Failed to redeem"}`);
        return;
      }
      const { redemption } = await res.json() as { redemption: Redemption };
      setRedemptions((prev) => [redemption, ...prev]);
      showToast("✨ Request sent — waiting for parent's approval");
      router.refresh();
    } finally {
      setRequesting(null);
    }
  }

  async function handleCancel(redemptionId: string) {
    if (!confirm("Cancel this request?")) return;
    const res = await fetch(`/api/redeem?id=${redemptionId}`, { method: "DELETE" });
    if (!res.ok) { showToast("❌ Couldn't cancel"); return; }
    setRedemptions((prev) => prev.filter((r) => r.id !== redemptionId));
    showToast("Cancelled");
    router.refresh();
  }

  const pending = redemptions.filter((r) => r.status === "pending");
  const history = redemptions.filter((r) => r.status !== "pending").slice(0, 20);

  return (
    <div className="flex flex-col gap-5">
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-xs text-center">
          {toast}
        </div>
      )}

      {/* Balance hero */}
      <div className="rounded-2xl border border-accent-amber/40 bg-gradient-to-br from-accent-amber/10 to-bg-elevated p-5 text-center">
        <p className="text-xs text-fg-muted uppercase tracking-wide">Available to spend</p>
        <p className="font-display font-bold text-4xl text-accent-amber mt-1">
          {spendable.toLocaleString()}
        </p>
        <p className="text-xs text-fg-muted mt-1">
          {balance.earned.toLocaleString()} earned · {balance.spent.toLocaleString()} spent
          {livePending > 0 && ` · ${livePending} pending`}
        </p>
      </div>

      {/* Rewards grid */}
      <div>
        <h2 className="font-display font-bold text-lg text-fg mb-3">🎁 Rewards</h2>
        {rewards.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-8 text-center">
            <p className="text-3xl mb-2">🎁</p>
            <p className="text-sm text-fg-muted">No rewards yet. Ask your parent to add some!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((r) => {
              const canAfford = spendable >= r.points_cost;
              const alreadyPending = pending.some((p) => p.reward_id === r.id);
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border bg-bg-elevated p-4 flex flex-col items-center gap-2 text-center transition-all ${
                    canAfford ? "border-[var(--border)]" : "border-[var(--border)] opacity-60"
                  }`}
                >
                  <span className="text-4xl">{r.icon ?? "🎁"}</span>
                  <p className="font-display font-semibold text-sm text-fg line-clamp-2 leading-tight">
                    {r.title}
                  </p>
                  <p className="text-xs font-bold text-accent-amber">{r.points_cost} pts</p>
                  {alreadyPending ? (
                    <button
                      disabled
                      className="w-full rounded-xl bg-bg border border-[var(--border)] text-fg-muted text-xs px-3 py-2"
                    >
                      ⏳ Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRedeem(r)}
                      disabled={!canAfford || requesting === r.id}
                      className={`w-full rounded-xl text-xs font-semibold px-3 py-2 transition-opacity ${
                        canAfford
                          ? "bg-accent-teal text-black hover:opacity-90"
                          : "bg-bg border border-[var(--border)] text-fg-muted"
                      } disabled:opacity-50`}
                    >
                      {requesting === r.id ? "…" : canAfford ? "Redeem" : "Save more"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-fg mb-2 text-sm uppercase tracking-wide text-fg-muted">
            Waiting on parent
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-2xl">{r.reward_icon ?? "🎁"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{r.reward_title}</p>
                  <p className="text-xs text-fg-muted">{r.points_cost} pts · ⏳ pending</p>
                </div>
                <button
                  onClick={() => handleCancel(r.id)}
                  className="text-xs text-fg-muted hover:text-red-400"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-fg mb-2 text-sm uppercase tracking-wide text-fg-muted">
            History
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {history.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-2xl ${r.status === "denied" ? "grayscale" : ""}`}>
                  {r.reward_icon ?? "🎁"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{r.reward_title}</p>
                  <p className="text-xs text-fg-muted">
                    {r.points_cost} pts · {new Date(r.decided_at ?? r.requested_at).toLocaleDateString("en-IN")}
                  </p>
                  {r.decided_note && (
                    <p className="text-xs text-fg-muted italic mt-0.5">&ldquo;{r.decided_note}&rdquo;</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  r.status === "approved"
                    ? "bg-accent-teal/20 text-accent-teal"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {r.status === "approved" ? "✓ Got it" : "✗ Denied"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
