"use client";

import { useState } from "react";
import type { Chore, DayOfWeek, Profile } from "@/lib/types";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const QUICK_ICONS = ["✅","💧","🧘","🎵","🪔","🎤","🫙","📚","🌙","☀️","🏃","🍎","📝","🎯","🌟"];

interface ChoreFormProps {
  initial?: Partial<Chore>;
  /** All children in the parent's family. */
  kids?: Profile[];
  /** Children currently assigned to this chore (only relevant for edits). */
  initialAssignedTo?: string[];
  onSave: (
    data: Omit<Chore, "id" | "created_at" | "created_by" | "family_id" | "deactivated_at"> & {
      assignedTo: string[];
    },
  ) => Promise<void>;
  onCancel: () => void;
}

export default function ChoreForm({ initial, kids = [], initialAssignedTo, onSave, onCancel }: ChoreFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "✅");
  const [points, setPoints] = useState(initial?.points ?? 10);
  const [recurrence, setRecurrence] = useState<DayOfWeek[]>(
    initial?.recurrence ?? ["mon","tue","wed","thu","fri","sat","sun"]
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  // Default: all current children selected (matches API default when assignedTo is omitted)
  const [assignedTo, setAssignedTo] = useState<string[]>(
    initialAssignedTo ?? kids.map((k) => k.id),
  );
  const [saving, setSaving] = useState(false);
  const [customIcon, setCustomIcon] = useState("");

  // Verification (Phase 5a)
  const [requiresApproval, setRequiresApproval] = useState(initial?.requires_parent_approval ?? false);
  const [requiresSelfReport, setRequiresSelfReport] = useState(initial?.requires_self_report ?? false);
  const [useWindow, setUseWindow] = useState(
    !!(initial?.window_start_time && initial?.window_end_time),
  );
  const [windowStart, setWindowStart] = useState(
    initial?.window_start_time?.slice(0, 5) ?? "07:00",
  );
  const [windowEnd, setWindowEnd] = useState(
    initial?.window_end_time?.slice(0, 5) ?? "09:00",
  );

  function toggleDay(day: DayOfWeek) {
    setRecurrence((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleAssigned(kidId: string) {
    setAssignedTo((prev) =>
      prev.includes(kidId) ? prev.filter((id) => id !== kidId) : [...prev, kidId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (useWindow && windowStart >= windowEnd) {
      alert("Window end time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        icon: (customIcon.trim() || icon),
        points,
        recurrence,
        is_active: isActive,
        sort_order: initial?.sort_order ?? 99,
        assignedTo,
        requires_parent_approval: requiresApproval,
        requires_self_report: requiresSelfReport,
        window_start_time: useWindow ? `${windowStart}:00` : null,
        window_end_time: useWindow ? `${windowEnd}:00` : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1.5">Title *</label>
        <input
          className="w-full rounded-xl border border-[var(--border)] bg-bg px-3 py-2.5 text-sm text-fg placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-teal"
          placeholder="e.g. Drink Warm Water"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1.5">Description</label>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-bg px-3 py-2.5 text-sm text-fg placeholder-fg-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-teal"
          placeholder="Optional details..."
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Icon picker */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1.5">Icon</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {QUICK_ICONS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => { setIcon(em); setCustomIcon(""); }}
              className={`text-xl w-9 h-9 rounded-xl border transition-all ${
                icon === em && !customIcon
                  ? "border-accent-amber bg-accent-amber/20 scale-110"
                  : "border-[var(--border)] bg-bg hover:scale-110"
              }`}
            >
              {em}
            </button>
          ))}
        </div>
        <input
          className="w-32 rounded-xl border border-[var(--border)] bg-bg px-3 py-2 text-sm text-fg placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-teal"
          placeholder="Custom emoji"
          value={customIcon}
          onChange={(e) => setCustomIcon(e.target.value)}
          maxLength={4}
        />
        <span className="text-sm text-fg-muted ml-2">Preview: {customIcon || icon}</span>
      </div>

      {/* Points */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1.5">Points</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPoints((p) => Math.max(5, p - 5))}
            className="w-9 h-9 rounded-xl border border-[var(--border)] bg-bg text-lg font-bold text-fg hover:bg-bg-elevated transition-colors"
            aria-label="Decrease points"
          >
            −
          </button>
          <span className="font-display font-bold text-xl text-accent-amber w-12 text-center">
            {points}
          </span>
          <button
            type="button"
            onClick={() => setPoints((p) => Math.min(100, p + 5))}
            className="w-9 h-9 rounded-xl border border-[var(--border)] bg-bg text-lg font-bold text-fg hover:bg-bg-elevated transition-colors"
            aria-label="Increase points"
          >
            +
          </button>
        </div>
      </div>

      {/* Recurrence */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1.5">Recurrence</label>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleDay(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                recurrence.includes(key)
                  ? "bg-accent-teal text-black border-accent-teal"
                  : "border-[var(--border)] text-fg-muted hover:border-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setRecurrence(["mon","tue","wed","thu","fri","sat","sun"])}
            className="text-xs text-accent-teal hover:underline"
          >
            All 7
          </button>
          <span className="text-fg-muted text-xs">·</span>
          <button
            type="button"
            onClick={() => setRecurrence(["mon","tue","wed","thu","fri","sat"])}
            className="text-xs text-accent-teal hover:underline"
          >
            Mon–Sat
          </button>
        </div>
      </div>

      {/* Applies to (per-child assignment) */}
      {kids.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-fg mb-1.5">Applies to</label>
          <div className="flex gap-1.5 flex-wrap">
            {kids.map((k) => {
              const selected = assignedTo.includes(k.id);
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => toggleAssigned(k.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selected
                      ? "bg-accent-teal text-black border-accent-teal"
                      : "border-[var(--border)] text-fg-muted hover:border-fg"
                  }`}
                >
                  {k.name?.split(" ")[0] ?? k.email}
                </button>
              );
            })}
          </div>
          {assignedTo.length === 0 && (
            <p className="text-xs text-fg-muted mt-2">⚠️ No children selected — nobody will see this task.</p>
          )}
        </div>
      )}

      {/* Verification (Phase 5a) */}
      <details className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4" open={requiresApproval || requiresSelfReport || useWindow}>
        <summary className="cursor-pointer text-sm font-semibold text-fg flex items-center gap-2">
          🔍 Verification
          {(requiresApproval || requiresSelfReport || useWindow) && (
            <span className="text-xs text-accent-amber">· on</span>
          )}
        </summary>
        <p className="text-xs text-fg-muted mt-2 mb-3">
          Optional. Honor-system is the default — only flip these on for chores where it matters.
        </p>

        {/* Parent approval */}
        <label className="flex items-start gap-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
            className="mt-1 h-4 w-4 accent-accent-teal"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-fg">Require parent approval</p>
            <p className="text-xs text-fg-muted">
              Kid submits → you approve on /admin/verifications before points are awarded.
            </p>
          </div>
        </label>

        {/* Self-report */}
        <label className="flex items-start gap-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={requiresSelfReport}
            onChange={(e) => setRequiresSelfReport(e.target.checked)}
            className="mt-1 h-4 w-4 accent-accent-teal"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-fg">Require self-report</p>
            <p className="text-xs text-fg-muted">
              On submit, kid fills in start time, end time, and a short note about what they did
              (pages read, what they practiced, etc.). Implies parent approval.
            </p>
          </div>
        </label>

        {/* Time window */}
        <label className="flex items-start gap-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useWindow}
            onChange={(e) => setUseWindow(e.target.checked)}
            className="mt-1 h-4 w-4 accent-accent-teal"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-fg">Time window (IST)</p>
            <p className="text-xs text-fg-muted">
              Can only be marked done inside this clock window each day.
            </p>
            {useWindow && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="time"
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                  className="rounded-lg bg-bg border border-[var(--border)] px-2 py-1 text-sm text-fg"
                />
                <span className="text-xs text-fg-muted">to</span>
                <input
                  type="time"
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(e.target.value)}
                  className="rounded-lg bg-bg border border-[var(--border)] px-2 py-1 text-sm text-fg"
                />
              </div>
            )}
          </div>
        </label>
      </details>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`relative w-11 h-6 rounded-full border-2 transition-colors ${
            isActive ? "bg-accent-teal border-accent-teal" : "bg-bg border-[var(--border)]"
          }`}
          aria-label="Toggle active"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              isActive ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-fg">{isActive ? "Active" : "Inactive"}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-fg-muted hover:bg-bg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 rounded-xl bg-accent-amber text-black font-semibold px-4 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Chore"}
        </button>
      </div>
    </form>
  );
}
