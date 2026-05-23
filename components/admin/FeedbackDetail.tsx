"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Feedback, FeedbackStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

export default function FeedbackDetail({ feedback }: { feedback: Feedback }) {
  const router = useRouter();
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [note, setNote] = useState(feedback.admin_note ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = status !== feedback.status || (note.trim() !== (feedback.admin_note ?? "").trim());

  async function handleSave() {
    if (!dirty || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/super/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_note: note.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to save.");
        setIsSaving(false);
        return;
      }
      setSavedAt(Date.now());
      setIsSaving(false);
      router.refresh();
    } catch {
      setError("Network error.");
      setIsSaving(false);
    }
  }

  return (
    <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] bg-bg/40">
      <div className="rounded-lg bg-bg-elevated border border-[var(--border)] p-4 mb-4">
        <p className="text-sm text-fg whitespace-pre-wrap leading-relaxed">{feedback.message}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs font-medium text-fg mb-1.5">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
            className="w-full rounded-lg border border-[var(--border)] bg-bg-elevated text-fg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-teal"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <div className="text-xs text-fg-muted self-end pb-2">
          {feedback.reviewed_at ? (
            <>Last reviewed {new Date(feedback.reviewed_at).toLocaleString()}</>
          ) : (
            <>Not yet reviewed</>
          )}
        </div>
      </div>

      <label className="block mt-3">
        <span className="block text-xs font-medium text-fg mb-1.5">Admin notes (private)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Triage notes, follow-up actions, etc."
          className="w-full rounded-lg border border-[var(--border)] bg-bg-elevated text-fg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-teal resize-none"
        />
      </label>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-4">
        {savedAt && !dirty && (
          <span className="text-xs text-fg-muted">Saved.</span>
        )}
        <button
          onClick={handleSave}
          disabled={!dirty || isSaving}
          className="flex items-center gap-2 bg-accent-teal text-black font-display font-bold text-sm px-5 py-2 rounded-full transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
}
