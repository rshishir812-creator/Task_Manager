"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  getDayOfWeek,
  getTodayIST,
  getChoresForDay,
} from "@/lib/streak-calculator";
import {
  hasFiredToday,
  markFired,
  msUntilSlot,
  isSlotDue,
  getPermission,
  type ReminderSlot,
} from "@/lib/notifications";
import type { Chore, ChoreCompletion } from "@/lib/types";

const SLOTS: ReminderSlot[] = ["midday", "evening"];
const BANNER_DURATION_MS = 7000;

export default function ReminderManager({ userId }: { userId: string }) {
  const [banner, setBanner] = useState<{ count: number } | null>(null);
  const incompleteRef = useRef<number>(0);
  const timersRef = useRef<Record<ReminderSlot, number | null>>({
    midday: null,
    evening: null,
  });

  const fetchIncompleteCount = useCallback(async () => {
    const supabase = createClient();
    const today = getTodayIST();
    const dow = getDayOfWeek(today);

    const [{ data: chores }, { data: completions }] = await Promise.all([
      supabase.from("chores").select("*").eq("is_active", true),
      supabase
        .from("chore_completions")
        .select("*")
        .eq("user_id", userId)
        .eq("completed_date", today),
    ]);

    const todays = getChoresForDay((chores as Chore[]) ?? [], dow);
    const doneIds = new Set(
      ((completions as ChoreCompletion[]) ?? []).map((c) => c.chore_id)
    );
    const remaining = todays.filter((c) => !doneIds.has(c.id)).length;
    incompleteRef.current = remaining;
    return remaining;
  }, [userId]);

  const fireReminder = useCallback(
    async (slot: ReminderSlot) => {
      const today = getTodayIST();
      if (hasFiredToday(userId, today, slot)) return;
      const count = await fetchIncompleteCount();
      if (count <= 0) return;

      markFired(userId, today, slot);

      const body =
        slot === "midday"
          ? `You have ${count} chore${count === 1 ? "" : "s"} left today 💪`
          : `Don't break the streak — ${count} chore${count === 1 ? "" : "s"} still pending 🌙`;

      if (getPermission() === "granted") {
        try {
          new Notification("ChoreQuest", {
            body,
            icon: "/favicon.ico",
            tag: `chorequest-${slot}`,
          });
          return;
        } catch {
          // OS-level block — fall through to in-app banner
        }
      }
      setBanner({ count });
      window.setTimeout(() => setBanner(null), BANNER_DURATION_MS);
    },
    [userId, fetchIncompleteCount]
  );

  const scheduleAll = useCallback(() => {
    // Clear existing
    for (const slot of SLOTS) {
      if (timersRef.current[slot] !== null) {
        window.clearTimeout(timersRef.current[slot]!);
        timersRef.current[slot] = null;
      }
    }

    const today = getTodayIST();
    for (const slot of SLOTS) {
      if (hasFiredToday(userId, today, slot)) continue;
      if (isSlotDue(slot)) {
        // Past the hour and not yet fired today — fire immediately (covers "user opened tab in afternoon" case)
        void fireReminder(slot);
        continue;
      }
      const ms = msUntilSlot(slot);
      if (ms === null) continue;
      timersRef.current[slot] = window.setTimeout(() => {
        void fireReminder(slot);
      }, ms);
    }
  }, [userId, fireReminder]);

  useEffect(() => {
    void fetchIncompleteCount();
    scheduleAll();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleAll();
    };
    const handleChoreCompleted = () => {
      void fetchIncompleteCount().then((remaining) => {
        if (remaining <= 0) {
          // Cancel pending timers — nothing left to remind about
          for (const slot of SLOTS) {
            if (timersRef.current[slot] !== null) {
              window.clearTimeout(timersRef.current[slot]!);
              timersRef.current[slot] = null;
            }
          }
        }
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("chore:completed", handleChoreCompleted);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("chore:completed", handleChoreCompleted);
      for (const slot of SLOTS) {
        if (timersRef.current[slot] !== null) {
          window.clearTimeout(timersRef.current[slot]!);
        }
      }
    };
  }, [fetchIncompleteCount, scheduleAll]);

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="fixed top-below-header left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-sm px-4 py-3 rounded-2xl bg-bg-elevated border border-accent-teal/40 shadow-lg flex items-center gap-3"
        >
          <span className="text-2xl">🎯</span>
          <div className="flex-1 text-sm text-fg">
            <p className="font-semibold leading-tight">Chore reminder</p>
            <p className="text-xs text-fg-muted">
              {banner.count} chore{banner.count === 1 ? "" : "s"} still pending today.
            </p>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-fg-muted text-lg leading-none px-1"
            aria-label="Dismiss"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
