"use client";

import { useState } from "react";

interface ExceptionModalProps {
  choreName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function ExceptionModal({
  choreName,
  onConfirm,
  onCancel,
}: ExceptionModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-bg-elevated rounded-2xl border border-[var(--border)] p-6 w-full max-w-sm shadow-xl">
        <div className="text-2xl mb-2">⚡</div>
        <h2 className="font-display font-bold text-lg text-fg mb-1">
          Mark as Exception
        </h2>
        <p className="text-sm text-fg-muted mb-4">
          <span className="text-fg font-semibold">{choreName}</span> — your streak stays safe, but no points for today.
        </p>
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-bg px-3 py-2 text-sm text-fg placeholder-fg-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-amber"
          rows={3}
          placeholder="Why are you skipping? (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-fg-muted hover:bg-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 rounded-xl bg-accent-amber text-black font-semibold px-4 py-2 text-sm hover:opacity-90 transition-opacity"
          >
            Mark Exception
          </button>
        </div>
      </div>
    </div>
  );
}
