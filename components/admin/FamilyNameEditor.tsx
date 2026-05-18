"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FamilyNameEditor({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(initialName);

  async function save() {
    const cleaned = draft.trim();
    if (!cleaned || cleaned === name) {
      setEditing(false);
      setDraft(name);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/parent/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleaned }),
      });
      if (res.ok) {
        setName(cleaned);
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={60}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setEditing(false); setDraft(name); }
          }}
          className="text-sm bg-bg border border-[var(--border)] rounded-lg px-2 py-1 text-fg focus:outline-none focus:ring-2 focus:ring-accent-teal"
        />
        <button
          onClick={save}
          disabled={saving}
          className="text-xs text-accent-teal font-semibold disabled:opacity-50"
        >
          {saving ? "…" : "Save"}
        </button>
        <button
          onClick={() => { setEditing(false); setDraft(name); }}
          className="text-xs text-fg-muted hover:text-fg"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <p className="text-sm text-fg-muted">{name}</p>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-fg-muted hover:text-accent-amber transition-colors"
        aria-label="Edit family name"
      >
        ✏️
      </button>
    </div>
  );
}
