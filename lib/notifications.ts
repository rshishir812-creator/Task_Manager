export type ReminderSlot = "midday" | "evening";

export const MIDDAY_HOUR = 13;
export const EVENING_HOUR = 20;

export const SLOT_HOUR: Record<ReminderSlot, number> = {
  midday: MIDDAY_HOUR,
  evening: EVENING_HOUR,
};

const PROMPT_DISMISSED_KEY = "chorequest:notifPromptDismissed";
const LAST_FIRED_KEY = "chorequest:lastReminderFired";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  return Notification.requestPermission();
}

export function isPromptDismissed(userId: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(`${PROMPT_DISMISSED_KEY}:${userId}`) === "true";
}

export function dismissPrompt(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${PROMPT_DISMISSED_KEY}:${userId}`, "true");
}

export function getLastFired(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${LAST_FIRED_KEY}:${userId}`);
}

export function markFired(userId: string, todayStr: string, slot: ReminderSlot): void {
  if (typeof window === "undefined") return;
  const existing = getLastFired(userId);
  const next = existing && existing.startsWith(todayStr)
    ? `${todayStr}:${Array.from(new Set([...existing.slice(todayStr.length + 1).split(","), slot])).filter(Boolean).join(",")}`
    : `${todayStr}:${slot}`;
  localStorage.setItem(`${LAST_FIRED_KEY}:${userId}`, next);
}

export function hasFiredToday(userId: string, todayStr: string, slot: ReminderSlot): boolean {
  const value = getLastFired(userId);
  if (!value || !value.startsWith(todayStr)) return false;
  const slots = value.slice(todayStr.length + 1).split(",");
  return slots.includes(slot);
}

/** True if local time has passed the given slot's hour. */
export function isSlotDue(slot: ReminderSlot, now: Date = new Date()): boolean {
  return now.getHours() >= SLOT_HOUR[slot];
}

/** Returns ms until the slot fires today, or null if it has already passed. */
export function msUntilSlot(slot: ReminderSlot, now: Date = new Date()): number | null {
  const target = new Date(now);
  target.setHours(SLOT_HOUR[slot], 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return diff > 0 ? diff : null;
}
