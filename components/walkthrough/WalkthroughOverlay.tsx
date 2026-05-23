"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PARENT_STEPS, CHILD_STEPS, type WalkthroughStep } from "@/lib/walkthrough-content";

interface WalkthroughOverlayProps {
  role: "parent" | "child";
  isAutoLaunch: boolean;
  onClose: () => void;
}

export default function WalkthroughOverlay({ role, isAutoLaunch, onClose }: WalkthroughOverlayProps) {
  const steps: WalkthroughStep[] = role === "parent" ? PARENT_STEPS : CHILD_STEPS;
  const [currentStep, setCurrentStep] = useState(0);

  const total = steps.length;
  const step = steps[currentStep]!;
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;

  const dismiss = () => {
    if (isAutoLaunch) {
      fetch("/api/walkthrough/dismiss", { method: "POST" }).catch(() => {});
    }
    onClose();
  };

  const next = () => {
    if (isLast) {
      dismiss();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const previous = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={dismiss}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-bg-elevated shadow-xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close X */}
          <button
            onClick={dismiss}
            aria-label="Close walkthrough"
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-fg-muted hover:text-fg hover:bg-bg transition-colors"
          >
            ✕
          </button>

          {/* Step content */}
          <div className="px-6 pt-10 pb-6 text-center min-h-[280px] flex flex-col items-center justify-center">
            <motion.div
              key={`icon-${currentStep}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="text-6xl mb-4"
            >
              {step.icon}
            </motion.div>
            <motion.h2
              key={`title-${currentStep}`}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="font-display font-bold text-2xl text-fg mb-3"
            >
              {step.title}
            </motion.h2>
            <motion.p
              key={`body-${currentStep}`}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-fg-muted text-sm leading-relaxed max-w-xs"
            >
              {step.body}
            </motion.p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 px-6 pb-4">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? "w-6 bg-accent-teal"
                    : i < currentStep
                    ? "w-1.5 bg-accent-teal/50"
                    : "w-1.5 bg-[var(--border)]"
                }`}
              />
            ))}
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-2 border-t border-[var(--border)]">
            <button
              onClick={previous}
              disabled={isFirst}
              className="text-sm font-medium text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ◀ Previous
            </button>
            <span className="text-xs text-fg-muted">
              {currentStep + 1} / {total}
            </span>
            <button
              onClick={next}
              className="bg-accent-teal text-black font-display font-bold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              {isLast ? "Done 🎉" : "Next ▶"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
