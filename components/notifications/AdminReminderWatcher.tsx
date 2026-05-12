"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getTodayIST } from "@/lib/streak-calculator";
import {
  hasFiredToday,
  markFired,
  msUntilSlot,
  isSlotDue,
  getPermission,
  type ReminderSlot,
} from "@/lib/notifications";

type Summary = {
  totalUsers: number;
  behindCount: number;
  behindUsers: { id: string; name: string; pendingCount: number }[];
};

const SLOTS: ReminderSlot[] = ["midday", "evening"];
const BANNER_DURATION_MS = 8000;
const ADMIN_KEY_PREFIX = "admin";

export default function AdminReminderWatcher({ adminId }: { adminId: string }) {
  const [banner, setBanner] = useState<Summary | null>(null);
  const timersRef = useRef<Record<ReminderSlot, number | null>>({
    midday: null,
    evening: null,
  });

  const scopedId = `${ADMIN_KEY_PREFIX}:${adminId}`;

  const fetchSummary = useCallback(async (): Promise<Summary | null> => {
    try {
      const res = await fetch("/api/admin/reminder-summary", { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as Summary;
    } catch {
      return null;
    }
  }, []);

  const fireReminder = useCallback(
    async (slot: ReminderSlot) => {
      const today = getTodayIST();
      if (hasFiredToday(scopedId, today, slot)) return;

      const summary = await fetchSummary();
      if (!summary || summary.behindCount === 0) return;

      markFired(scopedId, today, slot);

      const names = summary.behindUsers
        .slice(0, 3)
        .map((u) => u.name.split(" ")[0])
        .join(", ");
      const extra = summary.behindUsers.length > 3 ? ` +${summary.behindUsers.length - 3} more` : "";
      const body =
        slot === "midday"
          ? `Reminders sent 📤 — ${summary.behindCount}/${summary.totalUsers} still pending (${names}${extra})`
          : `Evening reminders sent 🌙 — ${summary.behindCount} user${summary.behindCount === 1 ? "" : "s"} still behind (${names}${extra})`;

      if (
        document.visibilityState === "hidden" &&
        getPermission() === "granted"
      ) {
        try {
          new Notification("ChoreQuest Admin", {
            body,
            icon: "/favicon.ico",
            tag: `chorequest-admin-${slot}`,
          });
        } catch {
          /* OS-level block — silently fall through */
        }
      } else {
        setBanner(summary);
        window.setTimeout(() => setBanner(null), BANNER_DURATION_MS);
      }
    },
    [scopedId, fetchSummary]
  );

  const scheduleAll = useCallback(() => {
    for (const slot of SLOTS) {
      if (timersRef.current[slot] !== null) {
        window.clearTimeout(timersRef.current[slot]!);
        timersRef.current[slot] = null;
      }
    }

    const today = getTodayIST();
    for (const slot of SLOTS) {
      if (hasFiredToday(scopedId, today, slot)) continue;
      if (isSlotDue(slot)) {
        void fireReminder(slot);
        continue;
      }
      const ms = msUntilSlot(slot);
      if (ms === null) continue;
      timersRef.current[slot] = window.setTimeout(() => {
        void fireReminder(slot);
      }, ms);
    }
  }, [scopedId, fireReminder]);

  useEffect(() => {
    scheduleAll();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleAll();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      for (const slot of SLOTS) {
        if (timersRef.current[slot] !== null) {
          window.clearTimeout(timersRef.current[slot]!);
        }
      }
    };
  }, [scheduleAll]);

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md px-4 py-3 rounded-2xl bg-bg-elevated border border-accent-amber/40 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📣</span>
            <div className="flex-1 text-sm text-fg">
              <p className="font-semibold leading-tight">Reminder dispatched</p>
              <p className="text-xs text-fg-muted mt-0.5">
                {banner.behindCount} of {banner.totalUsers} user{banner.totalUsers === 1 ? "" : "s"} still have chores pending today.
              </p>
              {banner.behindUsers.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs">
                  {banner.behindUsers.slice(0, 4).map((u) => (
                    <li key={u.id} className="text-fg-muted">
                      • <span className="text-fg">{u.name}</span> — {u.pendingCount} pending
                    </li>
                  ))}
                  {banner.behindUsers.length > 4 && (
                    <li className="text-fg-muted">+ {banner.behindUsers.length - 4} more…</li>
                  )}
                </ul>
              )}
            </div>
            <button
              onClick={() => setBanner(null)}
              className="text-fg-muted text-lg leading-none px-1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
