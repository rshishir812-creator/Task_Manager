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

type Mode = "user" | "admin";

const COPY: Record<Mode, { title: string; body: string; accent: string }> = {
  user: {
    title: "Stay on top of your streak",
    body: "Get a friendly reminder to log chores.",
    accent: "bg-accent-teal",
  },
  admin: {
    title: "Get reminder dispatch alerts",
    body: "Know when nudges go out and who's still behind.",
    accent: "bg-accent-amber",
  },
};

export default function EnableNotificationsPrompt({
  userId,
  mode = "user",
}: {
  userId: string;
  mode?: Mode;
}) {
  const [visible, setVisible] = useState(false);
  const copy = COPY[mode];

  useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      if (cancelled) return;
      if (getPermission() !== "default") return;
      if (isPromptDismissed(`${mode}:${userId}`)) return;

      if (mode === "admin") {
        window.setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 3000);
        return;
      }

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
  }, [userId, mode]);

  const handleEnable = async () => {
    await requestPermission();
    dismissPrompt(`${mode}:${userId}`);
    setVisible(false);
  };

  const handleDismiss = () => {
    dismissPrompt(`${mode}:${userId}`);
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
          className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-sm px-4 py-3 rounded-2xl bg-bg-elevated border border-[var(--border)] shadow-lg flex items-center gap-3"
        >
          <span className="text-2xl">🔔</span>
          <div className="flex-1 text-sm text-fg">
            <p className="font-semibold leading-tight">{copy.title}</p>
            <p className="text-xs text-fg-muted">{copy.body}</p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={handleEnable}
              className={`px-3 py-1 text-xs font-semibold rounded-lg text-bg-elevated ${copy.accent}`}
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
