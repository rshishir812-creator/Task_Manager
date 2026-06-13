"use client";

import { motion, AnimatePresence } from "framer-motion";
import ConfettiBlast from "@/components/gamification/ConfettiBlast";
import { WHATS_NEW } from "@/lib/whats-new";

export default function WhatsNewModal({ onDone }: { onDone: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ConfettiBlast particleCount={110} originY={0.4} onDone={() => {}} />

        <motion.div
          className="relative w-full max-w-sm rounded-2xl border border-accent-teal/40 bg-bg-elevated p-6 text-center shadow-[0_0_30px_rgba(0,229,255,0.2)]"
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          <div className="text-5xl mb-2">{WHATS_NEW.emoji}</div>
          <h2 className="font-display font-bold text-xl text-fg">{WHATS_NEW.title}</h2>

          <ul className="mt-5 flex flex-col gap-3 text-left">
            {WHATS_NEW.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0" aria-hidden="true">{item.icon}</span>
                <span className="text-sm text-fg">{item.text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onDone}
            className="mt-6 w-full rounded-xl bg-accent-teal text-black font-display font-bold py-3 hover:scale-[1.02] transition-transform focus:outline-none focus:ring-2 focus:ring-accent-teal"
          >
            {WHATS_NEW.cta}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
