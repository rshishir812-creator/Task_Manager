"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/subscription";

/**
 * Super-admin control to set a family's subscription tier manually. Lets the
 * platform owner grant Premium before live billing exists.
 */
export default function SuperFamilyPlan({ familyId, plan }: { familyId: string; plan: Plan }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setTier(tier: "free" | "premium") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/super/family-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, tier }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const status = plan.tier === "premium"
    ? "Premium"
    : plan.isTrialing
      ? `Free (trial — ${plan.trialDaysLeft}d left)`
      : "Free";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div>
        <p className="text-sm font-semibold text-fg">Plan: {status}</p>
        {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTier("premium")}
          disabled={busy || plan.tier === "premium"}
          className="text-xs bg-accent-amber text-black font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
        >
          Set Premium
        </button>
        <button
          onClick={() => setTier("free")}
          disabled={busy || plan.tier === "free"}
          className="text-xs border border-[var(--border)] text-fg-muted hover:text-fg px-3 py-1.5 rounded-full disabled:opacity-40"
        >
          Set Free
        </button>
      </div>
    </div>
  );
}
