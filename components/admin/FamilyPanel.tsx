"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, ChildInvitation } from "@/lib/types";

interface FamilyPanelProps {
  initialChildren: Profile[];
  initialInvitations: ChildInvitation[];
}

export default function FamilyPanel({ initialChildren, initialInvitations }: FamilyPanelProps) {
  const router = useRouter();
  const [children] = useState(initialChildren);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, email: email.trim() }),
      });
      const data = await res.json() as { invitation?: ChildInvitation; error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Failed to invite");
        return;
      }
      if (data.invitation) {
        setInvitations((prev) => [data.invitation!, ...prev]);
        setName("");
        setEmail("");
        showToast("✅ Invitation sent. Ask them to sign in with Google.");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(invitationId: string) {
    if (!confirm("Cancel this invitation?")) return;
    const res = await fetch(`/api/parent/children?invitationId=${invitationId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      showToast("Failed to revoke");
      return;
    }
    setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    showToast("Invitation revoked");
    router.refresh();
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-sm text-center">
          {toast}
        </div>
      )}

      {/* Children list */}
      <section>
        <h2 className="font-display font-semibold text-fg mb-3 text-sm uppercase tracking-wide text-fg-muted">Children</h2>
        {children.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-6 text-center">
            <p className="text-sm text-fg-muted">No children yet. Invite one below.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {children.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-fg">{c.name ?? c.email}</p>
                  <p className="text-xs text-fg-muted">{c.email}</p>
                </div>
                <a
                  href={`/admin/view-as-user?child=${c.id}`}
                  className="text-xs bg-accent-amber/20 text-accent-amber px-3 py-1 rounded-full hover:bg-accent-amber/40 transition-colors"
                >
                  View as
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3 text-sm uppercase tracking-wide text-fg-muted">Pending invitations</h2>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-fg">{inv.email}</p>
                  <p className="text-xs text-fg-muted">
                    Invited {new Date(inv.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="text-xs text-fg-muted hover:text-red-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite form */}
      <section>
        <h2 className="font-display font-semibold text-fg mb-3 text-sm uppercase tracking-wide text-fg-muted">Add a child</h2>
        <form
          onSubmit={handleInvite}
          className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex flex-col gap-3"
        >
          <div>
            <label className="text-xs text-fg-muted">Child&apos;s name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ridham"
              className="w-full mt-1 rounded-xl bg-bg border border-[var(--border)] px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-teal"
            />
          </div>
          <div>
            <label className="text-xs text-fg-muted">Google email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="child@gmail.com"
              className="w-full mt-1 rounded-xl bg-bg border border-[var(--border)] px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-teal"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="self-start rounded-xl bg-accent-teal text-black font-semibold text-sm px-4 py-2 disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send invite"}
          </button>
          <p className="text-xs text-fg-muted">
            They&apos;ll be added when they sign in with Google using this email.
          </p>
        </form>
      </section>
    </>
  );
}
