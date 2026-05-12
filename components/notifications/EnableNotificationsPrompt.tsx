"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getTodayIST } from "@/lib/streak-calculator";
import {
  dismissPrompt,
  getPermission,
  isPromptDismissed,
  requestPermission,
} from "@/lib/notifications";

export default function EnableNotificationsPrompt({ userId }: { userId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      if (cancelled) return;
      if (getPermission() !== "default") return;
      if (isPromptDismissed(userId)) return;

      const supabase = createClient();
      const today = getTodayIST();
      const { count } = await supabase
        .from("chore_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("completed_date", today);

      if (cancelled) return;
      if ((count ?? 0) > 0) {
        window.setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 1500);
      }
    };

    void evaluate();
    const onChoreCompleted = () => void evaluate();
    window.addEventListener("chore:completed", onChoreCompleted);

    return () => {
      cancelled = true;
      window.removeEventListener("chore:completed", onChoreCompleted);
    };
  }, [userId]);

  const handleEnable = async () => {
    await requestPermission();
    dismissPrompt(userId);
    setVisible(false);
  };

  const handleDismiss = () => {
    dismissPrompt(userId);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-sm px-4 py-3 rounded-2xl bg-bg-elevated border border-[var(--border)] shadow-lg flex items-center gap-3"
        >
          <span className="text-2xl">🔔</span>
          <div className="flex-1 text-sm text-fg">
            <p className="font-semibold leading-tight">Stay on top of your streak</p>
            <p className="text-xs text-fg-muted">Get a friendly reminder to log chores.</p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={handleEnable}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-accent-teal text-bg-elevated"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-xs text-fg-muted"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
