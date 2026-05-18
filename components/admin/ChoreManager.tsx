"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Chore, DayOfWeek } from "@/lib/types";
import ChoreForm from "./ChoreForm";

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "M", tue: "T", wed: "W", thu: "T", fri: "F", sat: "S", sun: "Su",
};
const ALL_DAYS: DayOfWeek[] = ["mon","tue","wed","thu","fri","sat","sun"];

interface ChoreManagerProps {
  initialChores: Chore[];
}

export default function ChoreManager({ initialChores }: ChoreManagerProps) {
  const router = useRouter();
  const [chores, setChores] = useState(initialChores);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Chore | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleCreate = useCallback(
    async (data: Omit<Chore, "id" | "created_at" | "created_by" | "family_id">) => {
      const res = await fetch("/api/admin/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { showToast("❌ Failed to create chore"); return; }
      const { chore } = await res.json() as { chore: Chore };
      setChores((prev) => [...prev, chore]);
      setShowForm(false);
      showToast("✅ Chore created!");
      router.refresh();
    },
    [router]
  );

  const handleUpdate = useCallback(
    async (data: Omit<Chore, "id" | "created_at" | "created_by" | "family_id">) => {
      if (!editing) return;
      const res = await fetch(`/api/admin/chores/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { showToast("❌ Failed to update chore"); return; }
      const { chore } = await res.json() as { chore: Chore };
      setChores((prev) => prev.map((c) => (c.id === chore.id ? chore : c)));
      setEditing(null);
      showToast("✅ Chore updated!");
      router.refresh();
    },
    [editing, router]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/chores/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("❌ Failed to delete chore"); return; }
      setChores((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirm(null);
      showToast("🗑️ Chore deleted");
      router.refresh();
    },
    [router]
  );

  const handleToggleActive = useCallback(
    async (chore: Chore) => {
      const res = await fetch(`/api/admin/chores/${chore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !chore.is_active }),
      });
      if (!res.ok) return;
      const { chore: updated } = await res.json() as { chore: Chore };
      setChores((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    },
    []
  );

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index === 0) return;
      const newChores = [...chores];
      const tmp = newChores[index - 1];
      newChores[index - 1] = newChores[index]!;
      newChores[index] = tmp!;
      setChores(newChores);
      await fetch("/api/admin/chores/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newChores.map((c) => c.id) }),
      });
    },
    [chores]
  );

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index === chores.length - 1) return;
      const newChores = [...chores];
      const tmp = newChores[index];
      newChores[index] = newChores[index + 1]!;
      newChores[index + 1] = tmp!;
      setChores(newChores);
      await fetch("/api/admin/chores/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newChores.map((c) => c.id) }),
      });
    },
    [chores]
  );

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Add button */}
      {!showForm && !editing && (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-bg hover:border-accent-amber hover:bg-accent-amber/5 p-4 text-sm text-fg-muted hover:text-accent-amber transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span> Add New Chore
        </button>
      )}

      {/* Create form */}
      {showForm && !editing && (
        <div className="rounded-2xl border border-accent-amber/50 bg-bg-elevated p-5">
          <h3 className="font-display font-bold text-fg mb-4">New Chore</h3>
          <ChoreForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="rounded-2xl border border-accent-amber/50 bg-bg-elevated p-5">
          <h3 className="font-display font-bold text-fg mb-4">Edit: {editing.title}</h3>
          <ChoreForm
            initial={editing}
            onSave={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Chore list */}
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
        {chores.length === 0 && (
          <p className="px-5 py-6 text-sm text-fg-muted text-center">No chores yet.</p>
        )}
        {chores.map((chore, i) => (
          <div
            key={chore.id}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-[var(--border)]" : ""} ${!chore.is_active ? "opacity-50" : ""}`}
          >
            {/* Reorder */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => handleMoveUp(i)}
                disabled={i === 0}
                className="text-xs text-fg-muted hover:text-fg disabled:opacity-20 leading-none px-1"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                onClick={() => handleMoveDown(i)}
                disabled={i === chores.length - 1}
                className="text-xs text-fg-muted hover:text-fg disabled:opacity-20 leading-none px-1"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            <span className="text-2xl flex-shrink-0">{chore.icon ?? "✅"}</span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg truncate">{chore.title}</p>
              {/* Day indicators */}
              <div className="flex gap-0.5 mt-1">
                {ALL_DAYS.map((d) => (
                  <span
                    key={d}
                    className={`text-[10px] px-1 rounded ${
                      chore.recurrence.includes(d)
                        ? "bg-accent-teal/20 text-accent-teal"
                        : "bg-[var(--border)]/40 text-fg-muted"
                    }`}
                  >
                    {DAY_LABELS[d]}
                  </span>
                ))}
              </div>
            </div>

            <span className="text-xs font-semibold text-accent-amber flex-shrink-0">
              +{chore.points}
            </span>

            {/* Active toggle */}
            <button
              onClick={() => handleToggleActive(chore)}
              className={`relative w-9 h-5 rounded-full border-2 transition-colors flex-shrink-0 ${
                chore.is_active ? "bg-accent-teal border-accent-teal" : "bg-bg border-[var(--border)]"
              }`}
              aria-label={chore.is_active ? "Deactivate" : "Activate"}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                  chore.is_active ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>

            {/* Edit */}
            <button
              onClick={() => { setEditing(chore); setShowForm(false); }}
              className="text-xs text-fg-muted hover:text-accent-teal transition-colors px-1"
              aria-label="Edit"
            >
              ✏️
            </button>

            {/* Delete */}
            {deleteConfirm === chore.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(chore.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-xs text-fg-muted hover:text-fg"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(chore.id)}
                className="text-xs text-fg-muted hover:text-red-400 transition-colors px-1"
                aria-label="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
