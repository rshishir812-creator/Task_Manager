"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConfettiBlast from "./ConfettiBlast";

export interface CompletedQuest {
  title: string;
  icon: string;
  description?: string;
  reward_points: number;
}

interface QuestCompleteModalProps {
  quests: CompletedQuest[];
  onDone: () => void;
}

export default function QuestCompleteModal({ quests, onDone }: QuestCompleteModalProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (quests.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDone}
      >
        <ConfettiBlast particleCount={130} onDone={() => {}} />

        <motion.div
          className="text-center px-8 max-w-sm"
          initial={{ scale: 0.6, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-accent-teal font-display font-bold text-sm uppercase tracking-widest mb-3">
            ⚔️ Quest Complete{quests.length > 1 ? " ×" + quests.length : ""}!
          </p>

          <div className="flex flex-col gap-3">
            {quests.map((q, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-accent-teal/40 bg-bg-elevated/90 p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(0,229,255,0.25)]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
              >
                <motion.span
                  className="text-4xl flex-shrink-0"
                  animate={{ scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                >
                  {q.icon}
                </motion.span>
                <div className="text-left">
                  <p className="font-display font-bold text-fg text-base">{q.title}</p>
                  <p className="text-xs text-accent-amber font-semibold mt-0.5">
                    +{q.reward_points.toLocaleString()} XP
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-fg-muted text-xs mt-5">Tap anywhere to continue</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
