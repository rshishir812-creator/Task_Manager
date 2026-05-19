"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Reward, RewardAssignment } from "@/lib/types";

const QUICK_ICONS = ["🎁","🍫","🍦","🍕","🍔","🎮","📱","🎬","🛍️","💰","⏰","🏖️","🎢","📚","🧸"];

interface RewardManagerProps {
  initialRewards: Reward[];
  kids: Profile[];
  initialAssignments: RewardAssignment[];
}

interface RewardFormState {
  title: string;
  description: string;
  icon: string;
  customIcon: string;
  points_cost: number;
  is_active: boolean;
  assignedTo: string[];
}

function defaultForm(kids: Profile[]): RewardFormState {
  return {
    title: "",
    description: "",
    icon: "🎁",
    customIcon: "",
    points_cost: 100,
    is_active: true,
    assignedTo: kids.map((k) => k.id),
  };
}

export default function RewardManager({ initialRewards, kids, initialAssignments }: RewardManagerProps) {
  const router = useRouter();
  const [rewards, setRewards] = useState(initialRewards);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState<RewardFormState>(defaultForm(kids));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // currentAssignedFor[rewardId] = list of active user_ids
  const currentAssignedFor = new Map<string, string[]>();
  for (const a of assignments) {
    if (a.removed_at !== null) continue;
    if (!currentAssignedFor.has(a.reward_id)) currentAssignedFor.set(a.reward_id, []);
    currentAssignedFor.get(a.reward_id)!.push(a.user_id);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openCreate() {
    setEditing(null);
    setForm(defaultForm(kids));
    setShowForm(true);
  }

  function openEdit(reward: Reward) {
    setEditing(reward);
    setForm({
      title: reward.title,
      description: reward.description ?? "",
      icon: reward.icon ?? "🎁",
      customIcon: "",
      points_cost: reward.points_cost,
      is_active: reward.is_active,
      assignedTo: currentAssignedFor.get(reward.id) ?? [],
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function toggleAssigned(kidId: string) {
    setForm((f) => ({
      ...f,
      assignedTo: f.assignedTo.includes(kidId)
        ? f.assignedTo.filter((id) => id !== kidId)
        : [...f.assignedTo, kidId],
    }));
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      icon: form.customIcon.trim() || form.icon,
      points_cost: form.points_cost,
      is_active: form.is_active,
      assignedTo: form.assignedTo,
    };

    try {
      const url = editing ? `/api/admin/rewards/${editing.id}` : "/api/admin/rewards";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        showToast(`❌ ${data.error ?? "Failed to save"}`);
        return;
      }
      const { reward } = await res.json() as { reward: Reward };
      setRewards((prev) => editing
        ? prev.map((r) => r.id === reward.id ? reward : r)
        : [...prev, reward]);

      // Update local assignments
      const now = new Date().toISOString();
      setAssignments((prev) => [
        ...prev.filter((a) => a.reward_id !== reward.id),
        ...form.assignedTo.map((user_id) => ({
          reward_id: reward.id,
          user_id,
          created_at: now,
          removed_at: null,
        })),
      ]);

      showToast(editing ? "✅ Reward updated" : "✅ Reward created");
      closeForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [editing, form, router]);

  async function handleDelete(id: string) {
    if (!confirm("Archive this reward? Past redemptions stay in history.")) return;
    const res = await fetch(`/api/admin/rewards/${id}`, { method: "DELETE" });
    if (!res.ok) { showToast("❌ Failed to archive"); return; }
    setRewards((prev) => prev.map((r) => r.id === id ? { ...r, is_active: false } : r));
    showToast("📦 Reward archived");
    router.refresh();
  }

  const activeRewards = rewards.filter((r) => r.is_active);
  const archivedRewards = rewards.filter((r) => !r.is_active);

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-sm text-center">
          {toast}
        </div>
      )}

      {!showForm && (
        <button
          onClick={openCreate}
          className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-bg hover:border-accent-amber hover:bg-accent-amber/5 p-4 text-sm text-fg-muted hover:text-accent-amber transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span> Add a reward
        </button>
      )}

      {showForm && (
        <div className="rounded-2xl border border-accent-amber/50 bg-bg-elevated p-5 flex flex-col gap-4">
          <h3 className="font-display font-bold text-fg">
            {editing ? `Edit: ${editing.title}` : "New Reward"}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-fg mb-1.5">Title *</label>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-bg px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-amber"
                placeholder="e.g. McDonald's Meal"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-fg mb-1.5">Description</label>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-bg px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-amber"
                placeholder="Optional"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-fg mb-1.5">Icon</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {QUICK_ICONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: em, customIcon: "" }))}
                    className={`text-xl w-9 h-9 rounded-xl border transition-all ${
                      form.icon === em && !form.customIcon
                        ? "border-accent-amber bg-accent-amber/20 scale-110"
                        : "border-[var(--border)] bg-bg hover:scale-110"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <input
                className="w-32 rounded-xl border border-[var(--border)] bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-amber"
                placeholder="Custom emoji"
                value={form.customIcon}
                onChange={(e) => setForm((f) => ({ ...f, customIcon: e.target.value }))}
                maxLength={4}
              />
              <span className="text-sm text-fg-muted ml-2">Preview: {form.customIcon || form.icon}</span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-fg mb-1.5">Points cost</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, points_cost: Math.max(10, f.points_cost - 50) }))}
                  className="w-9 h-9 rounded-xl border border-[var(--border)] bg-bg text-lg font-bold text-fg hover:bg-bg-elevated"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={form.points_cost}
                  onChange={(e) => setForm((f) => ({ ...f, points_cost: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-24 text-center rounded-xl border border-[var(--border)] bg-bg px-3 py-2 text-fg font-display font-bold text-accent-amber"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, points_cost: f.points_cost + 50 }))}
                  className="w-9 h-9 rounded-xl border border-[var(--border)] bg-bg text-lg font-bold text-fg hover:bg-bg-elevated"
                >
                  +
                </button>
                <span className="text-sm text-fg-muted">points</span>
              </div>
            </div>

            {kids.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-fg mb-1.5">Available to</label>
                <div className="flex gap-2 flex-wrap">
                  {kids.map((kid) => {
                    const on = form.assignedTo.includes(kid.id);
                    return (
                      <button
                        key={kid.id}
                        type="button"
                        onClick={() => toggleAssigned(kid.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          on
                            ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/40"
                            : "border border-[var(--border)] text-fg-muted"
                        }`}
                      >
                        {kid.name?.split(" ")[0] ?? kid.email}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`relative w-11 h-6 rounded-full border-2 transition-colors ${
                  form.is_active ? "bg-accent-teal border-accent-teal" : "bg-bg border-[var(--border)]"
                }`}
                aria-label="Toggle active"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    form.is_active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm text-fg">{form.is_active ? "Active" : "Archived"}</span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-fg-muted hover:bg-bg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.title.trim()}
                className="flex-1 rounded-xl bg-accent-amber text-black font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active list */}
      {activeRewards.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-2 text-sm uppercase tracking-wide text-fg-muted">Active</h2>
          <div className="flex flex-col gap-2">
            {activeRewards.map((r) => {
              const assignedIds = currentAssignedFor.get(r.id) ?? [];
              const assignedNames = assignedIds
                .map((id) => kids.find((k) => k.id === id)?.name?.split(" ")[0] ?? "?")
                .filter(Boolean);
              return (
                <div key={r.id} className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex items-center gap-3">
                  <span className="text-2xl">{r.icon ?? "🎁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-accent-amber">{r.points_cost} pts</span>
                      {assignedNames.length > 0 && (
                        <span className="text-xs text-fg-muted truncate">
                          · {assignedNames.join(", ")}
                        </span>
                      )}
                    </div>
                    {r.description && <p className="text-xs text-fg-muted mt-1 truncate">{r.description}</p>}
                  </div>
                  <button
                    onClick={() => openEdit(r)}
                    className="text-xs text-accent-teal hover:underline px-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-xs text-fg-muted hover:text-red-400 px-2"
                    aria-label="Archive"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeRewards.length === 0 && !showForm && (
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-8 text-center">
          <p className="text-3xl mb-2">🎁</p>
          <p className="text-sm text-fg-muted">No rewards yet. Create the first one so your kids have something to save up for.</p>
        </div>
      )}

      {archivedRewards.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-fg-muted cursor-pointer hover:text-fg">
            Archived ({archivedRewards.length})
          </summary>
          <div className="flex flex-col gap-2 mt-2">
            {archivedRewards.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[var(--border)] bg-bg-elevated/50 p-4 flex items-center gap-3 opacity-60">
                <span className="text-2xl grayscale">{r.icon ?? "🎁"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{r.title}</p>
                  <p className="text-xs text-fg-muted">{r.points_cost} pts · archived</p>
                </div>
                <button
                  onClick={() => openEdit(r)}
                  className="text-xs text-accent-teal hover:underline px-2"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
