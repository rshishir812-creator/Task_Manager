"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Chore, ChoreCompletion, Profile } from "@/lib/types";

interface VerificationsPanelProps {
  initialCompletions: ChoreCompletion[];
  kids: Profile[];
  chores: Chore[];
}

function fmtTimeRange(startIso: string | null, endIso: string | null): string {
  if (!startIso || !endIso) return "";
  const s = new Date(startIso);
  const e = new Date(endIso);
  const mins = Math.round((e.getTime() - s.getTime()) / 60000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${fmt(s)} – ${fmt(e)} (${mins} min)`;
}

export default function VerificationsPanel({
  initialCompletions,
  kids,
  chores,
}: VerificationsPanelProps) {
  const router = useRouter();
  const [completions, setCompletions] = useState(initialCompletions);
  const [acting, setActing] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyNote, setDenyNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const kidById = new Map(kids.map((k) => [k.id, k]));
  const choreById = new Map(chores.map((c) => [c.id, c]));

  const pendingClean = completions.filter((c) => c.status === "pending");
  const recent = completions.filter((c) => c.status !== "pending").slice(0, 50);

  async function decide(id: string, action: "approve" | "deny", note?: string) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note ?? null }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        showToast(`❌ ${data.error ?? "Failed"}`);
        return;
      }
      // Update local
      setCompletions((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: action === "approve" ? "verified" : "denied",
                verified_at: new Date().toISOString(),
                denial_reason: action === "deny" ? (note?.trim() || null) : c.denial_reason,
              }
            : c,
        ),
      );
      showToast(action === "approve" ? "✅ Approved — streak bumped" : "🚫 Denied");
      router.refresh();
    } finally {
      setActing(null);
      setDenyingId(null);
      setDenyNote("");
    }
  }

  function kidName(userId: string): string {
    const k = kidById.get(userId);
    return k?.name?.split(" ")[0] ?? "Child";
  }

  function rowFor(c: ChoreCompletion) {
    const chore = choreById.get(c.chore_id);
    if (!chore) return null;
    return { chore };
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-sm text-center">
          {toast}
        </div>
      )}

      {/* Pending */}
      <section>
        <h2 className="font-display font-semibold text-fg mb-2 text-sm uppercase tracking-wide text-fg-muted">
          Pending ({pendingClean.length})
        </h2>
        {pendingClean.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-6 text-center">
            <p className="text-sm text-fg-muted">All caught up! No pending verifications.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingClean.map((c) => {
              const meta = rowFor(c);
              if (!meta) return null;
              const isDenying = denyingId === c.id;
              return (
                <div key={c.id} className="rounded-2xl border border-accent-amber/40 bg-bg-elevated p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{meta.chore.icon ?? "✅"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-fg">{meta.chore.title}</p>
                      <p className="text-xs text-fg-muted mt-0.5">
                        {kidName(c.user_id)} · {c.completed_date}
                      </p>
                      {(c.self_report_start_at || c.self_report_end_at) && (
                        <p className="text-xs text-fg-muted mt-1">
                          ⏰ {fmtTimeRange(c.self_report_start_at, c.self_report_end_at)}
                        </p>
                      )}
                      {c.notes && (
                        <div className="mt-2 rounded-lg bg-bg border border-[var(--border)] px-3 py-2">
                          <p className="text-xs text-fg-muted uppercase tracking-wide mb-1">What they did</p>
                          <p className="text-sm text-fg whitespace-pre-wrap">{c.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isDenying ? (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => decide(c.id, "approve")}
                        disabled={acting === c.id}
                        className="flex-1 rounded-xl bg-accent-teal text-black font-semibold text-sm px-4 py-2 disabled:opacity-50"
                      >
                        {acting === c.id ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => setDenyingId(c.id)}
                        disabled={acting === c.id}
                        className="rounded-xl border border-[var(--border)] text-fg-muted text-sm px-4 py-2 hover:bg-bg"
                      >
                        Deny
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-3">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Optional: tell them why"
                        value={denyNote}
                        onChange={(e) => setDenyNote(e.target.value)}
                        className="w-full rounded-xl bg-bg border border-[var(--border)] px-3 py-2 text-sm text-fg"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(c.id, "deny", denyNote)}
                          disabled={acting === c.id}
                          className="flex-1 rounded-xl bg-red-500/20 text-red-400 font-semibold text-sm px-4 py-2"
                        >
                          {acting === c.id ? "…" : "Confirm deny"}
                        </button>
                        <button
                          onClick={() => { setDenyingId(null); setDenyNote(""); }}
                          className="rounded-xl border border-[var(--border)] text-fg-muted text-sm px-4 py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-2 text-sm uppercase tracking-wide text-fg-muted">
            Recent
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {recent.map((c) => {
              const meta = rowFor(c);
              if (!meta) return null;
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-2xl">{meta.chore.icon ?? "✅"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate">{meta.chore.title}</p>
                    <p className="text-xs text-fg-muted">
                      {kidName(c.user_id)} · {c.completed_date}
                    </p>
                    {c.denial_reason && c.status === "denied" && (
                      <p className="text-xs text-fg-muted italic mt-0.5">&ldquo;{c.denial_reason}&rdquo;</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    c.status === "verified"
                      ? "bg-accent-teal/20 text-accent-teal"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {c.status === "verified" ? "Approved" : "Denied"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
