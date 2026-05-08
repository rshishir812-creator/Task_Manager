"use client";

import { useState } from "react";
import type { Chore, DayOfWeek } from "@/lib/types";

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
  onSave: (data: Omit<Chore, "id" | "created_at" | "created_by">) => Promise<void>;
  onCancel: () => void;
}

export default function ChoreForm({ initial, onSave, onCancel }: ChoreFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "✅");
  const [points, setPoints] = useState(initial?.points ?? 10);
  const [recurrence, setRecurrence] = useState<DayOfWeek[]>(
    initial?.recurrence ?? ["mon","tue","wed","thu","fri","sat","sun"]
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [customIcon, setCustomIcon] = useState("");

  function toggleDay(day: DayOfWeek) {
    setRecurrence((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
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
