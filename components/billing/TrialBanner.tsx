"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Plan } from "@/lib/subscription";
import UpgradeModal from "./UpgradeModal";

/**
 * Subtle, dismissible upgrade nudge for parents (never rendered for children —
 * it lives only in the admin layout).
 *   - Premium  → nothing.
 *   - Trialing → "X days left in your trial".
 *   - Free     → gentle "unlock more" nudge.
 * Dismissal is remembered for the current day so it doesn't nag on every load.
 */
export default function TrialBanner({ plan }: { plan: Plan }) {
  const [dismissed, setDismissed] = useState(true); // start hidden until we check storage
  const [modalOpen, setModalOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const storageKey = `cq:trialbanner:${plan.tier}:${plan.isTrialing ? "trial" : "free"}:${today}`;

  useEffect(() => {
    if (plan.tier === "premium") return;
    try {
      if (localStorage.getItem(storageKey) !== "1") setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, [plan.tier, storageKey]);

  if (plan.tier === "premium") return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  }

  const trialing = plan.isTrialing;

  return (
    <>
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-above-nav md:bottom-4 right-3 left-3 md:left-auto md:right-4 z-40 mx-auto md:mx-0 w-[calc(100%-1.5rem)] md:w-auto max-w-sm px-4 py-3 rounded-2xl bg-bg-elevated border border-[var(--border)] shadow-lg flex items-center gap-3"
          >
            <span className="text-2xl">{trialing ? "✨" : "⭐"}</span>
            <div className="flex-1 text-sm text-fg min-w-0">
              <p className="font-semibold leading-tight">
                {trialing
                  ? `${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? "" : "s"} left in your trial`
                  : "Unlock Rewards, Insights & more"}
              </p>
              <p className="text-xs text-fg-muted">
                {trialing
                  ? "Keep everything when your trial ends."
                  : plan.hasTrialedBefore
                    ? "Upgrade to ChoreQuest Premium."
                    : "Try every feature free for 7 days."}
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => setModalOpen(true)}
                className="px-3 py-1 text-xs font-semibold rounded-lg text-black bg-accent-amber"
              >
                {trialing || plan.hasTrialedBefore ? "Upgrade" : "Try free"}
              </button>
              <button onClick={dismiss} className="px-3 py-1 text-xs text-fg-muted">
                Not now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {modalOpen && <UpgradeModal plan={plan} onClose={() => setModalOpen(false)} />}
    </>
  );
}
