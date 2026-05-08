"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LevelUpModalProps {
  level: number;
  levelName: string;
  onDone: () => void;
}

export default function LevelUpModal({ level, levelName, onDone }: LevelUpModalProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDone}
      >
        <motion.div
          className="text-center"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <motion.div
            className="text-7xl mb-4"
            style={{ filter: "drop-shadow(0 0 20px #FFB347)" }}
            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            ⭐
          </motion.div>
          <p className="text-accent-amber font-display font-bold text-xl mb-1 uppercase tracking-widest">
            Level Up!
          </p>
          <p className="text-fg font-display font-bold text-4xl">Level {level}</p>
          <p className="text-accent-teal font-display text-2xl mt-1">{levelName}</p>
          <p className="text-fg-muted text-sm mt-4">Tap to continue</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
