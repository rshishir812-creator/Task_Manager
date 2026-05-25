"use client";

import { useState } from "react";
import type { Plan } from "@/lib/subscription";
import UpgradeModal from "./UpgradeModal";

/**
 * Full-page locked state shown in place of a Premium feature (Insights, Rewards,
 * Redemptions) when the family doesn't have access. Parent-facing only.
 */
export default function PremiumLocked({
  feature,
  description,
  icon = "⭐",
  plan,
}: {
  feature: string;
  description: string;
  icon?: string;
  plan: Plan;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center text-center gap-4 rounded-2xl border border-[var(--border)] bg-bg-elevated px-6 py-12 max-w-md mx-auto">
        <div className="relative">
          <span className="text-5xl">{icon}</span>
          <span className="absolute -bottom-1 -right-1 text-2xl">🔒</span>
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-fg">{feature} is a Premium feature</h1>
          <p className="text-sm text-fg-muted mt-2 leading-relaxed">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-accent-amber text-black font-display font-bold text-sm px-6 py-2.5 rounded-full transition-opacity hover:opacity-90"
        >
          {plan.hasTrialedBefore ? `Unlock ${feature}` : "Start free trial"}
        </button>
      </div>

      {open && <UpgradeModal plan={plan} feature={feature} onClose={() => setOpen(false)} />}
    </>
  );
}
