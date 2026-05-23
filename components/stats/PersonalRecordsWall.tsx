import type { Records, PersonalRecord } from "@/lib/insights";

interface PersonalRecordsWallProps {
  records: Records;
}

function formatSetOn(setOn: string | null): string {
  if (!setOn) return "—";
  const d = new Date(setOn + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function RecordTile({ record }: { record: PersonalRecord }) {
  const hasValue = record.value > 0;
  return (
    <div
      className={`relative rounded-2xl border p-4 text-center transition-all ${
        hasValue
          ? "border-[var(--border)] bg-bg-elevated"
          : "border-[var(--border)]/40 bg-bg-elevated/40"
      }`}
    >
      {record.isNew && hasValue && (
        <span className="absolute -top-2 -right-2 bg-accent-amber text-black text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-md">
          NEW!
        </span>
      )}
      <div className="text-2xl mb-1">{record.emoji}</div>
      <p className="font-display font-bold text-2xl text-fg leading-none">
        {hasValue ? record.value.toLocaleString() : "—"}
      </p>
      <p className="text-[10px] text-fg-muted uppercase tracking-wide mt-1">
        {record.unit}
      </p>
      <p className="text-xs text-fg mt-2 font-medium">{record.label}</p>
      {hasValue && record.setOn && (
        <p className="text-[10px] text-fg-muted mt-0.5">{formatSetOn(record.setOn)}</p>
      )}
    </div>
  );
}

export default function PersonalRecordsWall({ records }: PersonalRecordsWallProps) {
  const tiles = [
    records.longestStreak,
    records.bestWeek,
    records.bestDay,
    records.mostInDay,
    records.comebacks,
  ];

  return (
    <div>
      <h2 className="font-display font-semibold text-fg mb-3">🏆 Personal Records</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((r) => (
          <RecordTile key={r.label} record={r} />
        ))}
      </div>
    </div>
  );
}
