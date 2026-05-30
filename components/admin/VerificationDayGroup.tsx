"use client";

import { getTodayIST, getYesterdayIST } from "@/lib/streak-calculator";

interface VerificationDayGroupProps {
  date: string; // YYYY-MM-DD
  count: number;
  tone?: "amber" | "muted";
  children: React.ReactNode;
}

// Resolve a YYYY-MM-DD date into a friendly label:
//   today → "Today"
//   yesterday → "Yesterday"
//   within the last ~6 days → weekday name ("Tuesday")
//   otherwise → "Mon, 24 Mar"
function labelForDate(date: string): string {
  const today = getTodayIST();
  if (date === today) return "Today";
  if (date === getYesterdayIST(today)) return "Yesterday";

  const d = new Date(`${date}T12:00:00Z`);
  const todayD = new Date(`${today}T12:00:00Z`);
  const diffDays = Math.round((todayD.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays > 0 && diffDays < 7) {
    return d.toLocaleDateString("en-IN", { weekday: "long" });
  }
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function VerificationDayGroup({
  date,
  count,
  tone = "muted",
  children,
}: VerificationDayGroupProps) {
  const pillClass =
    tone === "amber"
      ? "bg-accent-amber/20 text-accent-amber"
      : "bg-[var(--border)] text-fg-muted";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold">
          {labelForDate(date)}
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${pillClass}`}>
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
