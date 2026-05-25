"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Plan } from "@/lib/subscription";
import { PLAN_FEATURES } from "./premium-features";
import UpgradeActions from "./UpgradeActions";

/**
 * Parent-facing upgrade modal. Shows the Free vs Premium comparison and the
 * trial / upgrade CTAs. Styled after ContactUsModal.
 */
export default function UpgradeModal({
  plan,
  feature,
  onClose,
}: {
  plan: Plan;
  feature?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 py-4 pt-safe pb-safe overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-bg-elevated shadow-xl my-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[var(--border)]/60 rounded-t-2xl">
            <h2 className="font-display font-bold text-lg text-fg flex items-center gap-2">
              <span>⭐</span> ChoreQuest Premium
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-fg-muted hover:text-fg hover:bg-bg transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="px-5 pt-4 pb-5">
            <p className="text-sm text-fg-muted mb-4">
              {feature
                ? `${feature} is a Premium feature. Unlock it — plus everything below.`
                : "Unlock the full ChoreQuest experience for your family."}
            </p>

            {/* Comparison */}
            <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-4">
              <div className="grid grid-cols-[1fr_auto_auto] text-xs">
                <div className="px-3 py-2 font-semibold text-fg-muted bg-bg">Feature</div>
                <div className="px-3 py-2 font-semibold text-fg-muted bg-bg text-center">Free</div>
                <div className="px-3 py-2 font-semibold text-accent-amber bg-bg text-center">Premium</div>
                {PLAN_FEATURES.map((row) => (
                  <FeatureRow key={row.label} {...row} />
                ))}
              </div>
            </div>

            {plan.isTrialing && (
              <p className="text-xs text-accent-teal text-center mb-3">
                You&apos;re on a free trial — {plan.trialDaysLeft} day
                {plan.trialDaysLeft === 1 ? "" : "s"} left.
              </p>
            )}

            <UpgradeActions plan={plan} onDone={onClose} />

            {!plan.hasTrialedBefore && (
              <p className="mt-3 text-center text-[11px] text-fg-muted/70">
                No card required for the trial. Cancel anytime.
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FeatureRow({ label, free, premium }: { label: string; free: string; premium: string }) {
  return (
    <>
      <div className="px-3 py-2 text-fg border-t border-[var(--border)]">{label}</div>
      <div className="px-3 py-2 text-fg-muted text-center border-t border-[var(--border)]">{free}</div>
      <div className="px-3 py-2 text-accent-amber font-semibold text-center border-t border-[var(--border)]">{premium}</div>
    </>
  );
}
