"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Chore, DayOfWeek, Profile, ChoreAssignment } from "@/lib/types";
import ChoreForm from "./ChoreForm";

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "M", tue: "T", wed: "W", thu: "T", fri: "F", sat: "S", sun: "Su",
};
const ALL_DAYS: DayOfWeek[] = ["mon","tue","wed","thu","fri","sat","sun"];

interface ChoreManagerProps {
  initialChores: Chore[];
  kids: Profile[];
  initialAssignments: ChoreAssignment[];
}

export default function ChoreManager({ initialChores, kids, initialAssignments }: ChoreManagerProps) {
  const router = useRouter();
  const [chores, setChores] = useState(initialChores);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Chore | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Build a quick chore_id -> assigned user_ids map
  const assignmentsByChore = new Map<string, string[]>();
  for (const a of assignments) {
    if (!assignmentsByChore.has(a.chore_id)) assignmentsByChore.set(a.chore_id, []);
    assignmentsByChore.get(a.chore_id)!.push(a.user_id);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleCreate = useCallback(
    async (data: Omit<Chore, "id" | "created_at" | "created_by" | "family_id" | "deactivated_at"> & { assignedTo: string[] }) => {
      const res = await fetch("/api/admin/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { showToast("❌ Failed to create chore"); return; }
      const { chore } = await res.json() as { chore: Chore };
      setChores((prev) => [...prev, chore]);
      const now = new Date().toISOString();
      setAssignments((prev) => [
        ...prev,
        ...data.assignedTo.map((user_id) => ({
          chore_id: chore.id,
          user_id,
          created_at: now,
          removed_at: null,
        })),
      ]);
      setShowForm(false);
      showToast("✅ Chore created!");
      router.refresh();
    },
    [router]
  );

  const handleUpdate = useCallback(
    async (data: Omit<Chore, "id" | "created_at" | "created_by" | "family_id" | "deactivated_at"> & { assignedTo: string[] }) => {
      if (!editing) return;
      const res = await fetch(`/api/admin/chores/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { showToast("❌ Failed to update chore"); return; }
      const { chore } = await res.json() as { chore: Chore };
      setChores((prev) => prev.map((c) => (c.id === chore.id ? chore : c)));
      const now = new Date().toISOString();
      setAssignments((prev) => [
        ...prev.filter((a) => a.chore_id !== chore.id),
        ...data.assignedTo.map((user_id) => ({
          chore_id: chore.id,
          user_id,
          created_at: now,
          removed_at: null,
        })),
      ]);
      setEditing(null);
      showToast("✅ Chore updated!");
      router.refresh();
    },
    [editing, router]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/chores/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("❌ Failed to archive chore"); return; }
      // Soft-delete: mark inactive in local state but keep the row visible if needed
      setChores((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: false } : c)));
      setDeleteConfirm(null);
      showToast("📦 Chore archived (past history kept)");
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
        <div className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg">
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
            kids={kids}
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
            kids={kids}
            initialAssignedTo={assignmentsByChore.get(editing.id) ?? []}
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
              {/* Assigned children */}
              {kids.length > 0 && (() => {
                const assignedIds = assignmentsByChore.get(chore.id) ?? [];
                const assignedKids = kids.filter((k) => assignedIds.includes(k.id));
                if (assignedKids.length === 0) {
                  return <p className="text-[10px] text-red-400 mt-1">⚠️ Not assigned to anyone</p>;
                }
                if (assignedKids.length === kids.length) {
                  return <p className="text-[10px] text-fg-muted mt-1">For: everyone</p>;
                }
                return (
                  <p className="text-[10px] text-fg-muted mt-1">
                    For: {assignedKids.map((k) => k.name?.split(" ")[0] ?? k.email).join(", ")}
                  </p>
                );
              })()}
              {/* Verification chips (Phase 5a) */}
              {(chore.requires_parent_approval || chore.requires_self_report || (chore.window_start_time && chore.window_end_time)) && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {chore.requires_parent_approval && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber">
                      📩 approval
                    </span>
                  )}
                  {chore.requires_self_report && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber">
                      📝 self-report
                    </span>
                  )}
                  {chore.window_start_time && chore.window_end_time && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-teal/15 text-accent-teal">
                      🕐 {chore.window_start_time.slice(0,5)}–{chore.window_end_time.slice(0,5)}
                    </span>
                  )}
                </div>
              )}
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
