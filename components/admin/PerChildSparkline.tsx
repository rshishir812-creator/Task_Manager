import type { SparklinePoint } from "@/lib/insights";
import type { Profile } from "@/lib/types";

interface PerChildSparklineProps {
  kid: Profile;
  points: SparklinePoint[];
}

function formatWeek(ws: string): string {
  return new Date(ws + "T12:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function PerChildSparkline({ kid, points }: PerChildSparklineProps) {
  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => p.consistencyPct), 1);
  const latest = points[points.length - 1]?.consistencyPct ?? 0;
  const prev = points[points.length - 2]?.consistencyPct ?? latest;
  const delta = latest - prev;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-display font-semibold text-fg text-sm">
            {kid.name?.split(" ")[0] ?? "Child"}
          </p>
          <p className="text-xs text-fg-muted">8-week consistency</p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-xl text-fg">{latest}%</p>
          <p className={`text-xs font-semibold ${delta > 0 ? "text-accent-teal" : delta < 0 ? "text-red-400" : "text-fg-muted"}`}>
            {delta > 0 ? `↑ ${delta}%` : delta < 0 ? `↓ ${Math.abs(delta)}%` : "— flat"}
          </p>
        </div>
      </div>

      {/* SVG sparkline */}
      <div className="relative h-16">
        <svg
          viewBox={`0 0 ${points.length * 12} 48`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Bars */}
          {points.map((p, i) => {
            const barH = max > 0 ? (p.consistencyPct / max) * 40 : 0;
            const isLast = i === points.length - 1;
            return (
              <rect
                key={p.weekStart}
                x={i * 12 + 1}
                y={48 - barH}
                width={9}
                height={Math.max(barH, 1)}
                rx={2}
                fill={isLast ? "var(--accent-teal)" : p.consistencyPct >= 70 ? "var(--accent-teal)" : p.consistencyPct >= 40 ? "var(--accent-amber)" : "rgb(239 68 68 / 0.6)"}
                opacity={isLast ? 1 : 0.6}
              />
            );
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1">
        <p className="text-[9px] text-fg-muted">{formatWeek(points[0]?.weekStart ?? "")}</p>
        <p className="text-[9px] text-fg-muted">{formatWeek(points[points.length - 1]?.weekStart ?? "")}</p>
      </div>
    </div>
  );
}
