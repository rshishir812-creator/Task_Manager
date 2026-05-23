import type { TimeOfDayBuckets } from "@/lib/insights";

interface TimeOfDayChartProps {
  buckets: TimeOfDayBuckets;
}

const LABELS = [
  { key: "morning" as const, label: "Morning", time: "6–11am" },
  { key: "midday" as const, label: "Midday", time: "11–4pm" },
  { key: "afternoon" as const, label: "Afternoon", time: "4–7pm" },
  { key: "evening" as const, label: "Evening", time: "7–10pm" },
];

export default function TimeOfDayChart({ buckets }: TimeOfDayChartProps) {
  if (buckets.total === 0) return null;

  const max = Math.max(buckets.morning, buckets.midday, buckets.afternoon, buckets.evening, 1);

  return (
    <div>
      <h2 className="font-display font-semibold text-fg mb-1">⏰ Your Power Hours</h2>
      <p className="text-xs text-fg-muted mb-4">
        {buckets.emoji} {buckets.personality} — based on when you tap chores done
      </p>
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4">
        <div className="flex items-end justify-around gap-2 h-24">
          {LABELS.map(({ key, label, time }) => {
            const val = buckets[key];
            const heightPct = (val / max) * 100;
            const isTop = val === max;
            return (
              <div key={key} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs font-bold text-fg-muted">{val > 0 ? val : ""}</span>
                <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isTop
                        ? "bg-gradient-to-t from-accent-amber to-accent-teal"
                        : "bg-[var(--border)]"
                    }`}
                    style={{ height: `${Math.max(heightPct, val > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <p className="text-[10px] font-semibold text-fg text-center leading-tight">{label}</p>
                <p className="text-[9px] text-fg-muted text-center leading-tight">{time}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
