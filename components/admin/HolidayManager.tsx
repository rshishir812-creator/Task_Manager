"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Holiday, HolidayReason } from "@/lib/types";

const REASONS: { value: HolidayReason; label: string; icon: string }[] = [
  { value: "illness", label: "Illness", icon: "🤒" },
  { value: "travel", label: "Travel", icon: "✈️" },
  { value: "other", label: "Other", icon: "🏖️" },
];

const REASON_META: Record<HolidayReason, { label: string; icon: string }> = {
  illness: { label: "Illness", icon: "🤒" },
  travel: { label: "Travel", icon: "✈️" },
  other: { label: "Other", icon: "🏖️" },
};

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  userId: string;
  childName: string;
  hasSiblings: boolean;
  initialHolidays: Holiday[];
}

export default function HolidayManager({ userId, childName, hasSiblings, initialHolidays }: Props) {
  const router = useRouter();
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState<HolidayReason>("travel");
  const [note, setNote] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (startDate > endDate) {
      showToast("❌ Start date must be on or before end date.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, applyToAll, startDate, endDate, reason, note }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        showToast(`❌ ${data.error ?? "Failed to save"}`);
        return;
      }
      const { holidays: created } = (await res.json()) as { holidays: Holiday[] };
      // Show the rows that belong to the child currently in view.
      const mine = created.filter((h) => h.user_id === userId);
      setHolidays((prev) => [...mine, ...prev].sort((a, b) => (a.start_date < b.start_date ? 1 : -1)));
      setNote("");
      showToast(applyToAll ? "✅ Holiday added for all kids" : "✅ Holiday added");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this holiday? Those days will count normally again.")) return;
    const res = await fetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
    if (!res.ok) {
      showToast("❌ Failed to remove");
      return;
    }
    setHolidays((prev) => prev.filter((h) => h.id !== id));
    showToast("🗑️ Holiday removed");
    router.refresh();
  }

  const today = todayISO();
  const upcoming = holidays.filter((h) => h.end_date >= today);
  const past = holidays.filter((h) => h.end_date < today);

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-amber";

  return (
    <div className="flex flex-col gap-5">
      {/* Add form */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex flex-col gap-3">
        <p className="font-display font-semibold text-fg">Add a holiday</p>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-fg-muted flex flex-col gap-1">
            From
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
          </label>
          <label className="text-xs text-fg-muted flex flex-col gap-1">
            To
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} required />
          </label>
        </div>

        <div className="flex gap-2">
          {REASONS.map((r) => (
            <button
              type="button"
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                reason === r.value
                  ? "border-accent-amber/50 bg-accent-amber/15 text-accent-amber font-semibold"
                  : "border-[var(--border)] text-fg-muted hover:text-fg"
              }`}
            >
              {r.icon} {r.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (e.g. Goa trip)"
          maxLength={80}
          className={inputClass}
        />

        {hasSiblings && (
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} />
            Apply to all kids (family trip)
          </label>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent-amber/20 text-accent-amber px-4 py-2 text-sm font-semibold hover:bg-accent-amber/30 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : applyToAll ? "Add for all kids" : `Add for ${childName}`}
        </button>
      </form>

      {/* Lists */}
      {holidays.length === 0 ? (
        <p className="text-sm text-fg-muted text-center py-4">No holidays yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {upcoming.length > 0 && (
            <Section title="Upcoming & current" items={upcoming} onDelete={handleDelete} />
          )}
          {past.length > 0 && (
            <Section title="Past" items={past} onDelete={handleDelete} muted />
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-xs text-center">
          {toast}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  onDelete,
  muted,
}: {
  title: string;
  items: Holiday[];
  onDelete: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className="font-display font-semibold text-sm text-fg-muted mb-2">{title}</h2>
      <div className={`flex flex-col gap-2 ${muted ? "opacity-70" : ""}`}>
        {items.map((h) => {
          const meta = REASON_META[h.reason];
          const single = h.start_date === h.end_date;
          return (
            <div key={h.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-bg-elevated px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-fg">
                  {meta.icon} {single ? fmt(h.start_date) : `${fmt(h.start_date)} → ${fmt(h.end_date)}`}
                </p>
                <p className="text-xs text-fg-muted">
                  {meta.label}{h.note ? ` · ${h.note}` : ""}
                </p>
              </div>
              <button
                onClick={() => onDelete(h.id)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 shrink-0"
                aria-label="Remove holiday"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
