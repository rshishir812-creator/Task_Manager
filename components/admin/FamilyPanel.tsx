"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Profile, ChildInvitation } from "@/lib/types";

interface FamilyPanelProps {
  initialChildren: Profile[];
  initialInvitations: ChildInvitation[];
}

export default function FamilyPanel({ initialChildren, initialInvitations }: FamilyPanelProps) {
  const router = useRouter();
  const [children, setChildren] = useState(initialChildren);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [coparentEmail, setCoparentEmail] = useState("");
  const [submittingCoparent, setSubmittingCoparent] = useState(false);

  const childInvitations = invitations.filter((i) => i.role !== "parent");
  const parentInvitations = invitations.filter((i) => i.role === "parent");

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

  async function handleInviteCoparent(e: React.FormEvent) {
    e.preventDefault();
    if (!coparentEmail.trim()) return;
    setSubmittingCoparent(true);
    try {
      const res = await fetch("/api/parent/coparent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: coparentEmail.trim() }),
      });
      const data = await res.json() as { invitation?: ChildInvitation; error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Failed to invite");
        return;
      }
      if (data.invitation) {
        setInvitations((prev) => [data.invitation!, ...prev]);
        setCoparentEmail("");
        showToast("✅ Co-parent invitation sent.");
        router.refresh();
      }
    } finally {
      setSubmittingCoparent(false);
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

  async function handleRemoveChild(childId: string) {
    setRemoving(childId);
    setConfirmRemove(null);
    try {
      const res = await fetch(`/api/parent/children/${childId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        showToast("❌ Failed to remove child");
        return;
      }
      setChildren((prev) => prev.filter((c) => c.id !== childId));
      showToast("🗑️ Child removed");
      router.refresh();
    } finally {
      setRemoving(null);
    }
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-[var(--border)] text-fg text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-sm text-center">
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
            {children.map((c) => {
              const isConfirming = confirmRemove === c.id;
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  {c.avatar_url ? (
                    <Image
                      src={c.avatar_url}
                      alt={c.name ?? "Child"}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-bg flex items-center justify-center text-fg-muted text-sm font-semibold">
                      {(c.name ?? c.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate">{c.name ?? c.email}</p>
                    <p className="text-xs text-fg-muted truncate">{c.email}</p>
                  </div>
                  {isConfirming ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveChild(c.id)}
                        disabled={removing === c.id}
                        className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full hover:bg-red-500/40 transition-colors disabled:opacity-50"
                      >
                        {removing === c.id ? "…" : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="text-xs text-fg-muted hover:text-fg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <a
                        href={`/admin/view-as-user?child=${c.id}`}
                        className="text-xs bg-accent-amber/20 text-accent-amber px-3 py-1 rounded-full hover:bg-accent-amber/40 transition-colors"
                      >
                        View as
                      </a>
                      <button
                        onClick={() => setConfirmRemove(c.id)}
                        className="text-xs text-fg-muted hover:text-red-400 transition-colors"
                        aria-label="Remove child"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {children.length > 0 && (
          <p className="text-xs text-fg-muted mt-2">
            Removing a child deletes their streaks, badges, and history. Their Google account is not affected.
          </p>
        )}
      </section>

      {/* Pending child invitations */}
      {childInvitations.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3 text-sm uppercase tracking-wide text-fg-muted">Pending child invitations</h2>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {childInvitations.map((inv) => (
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

      {/* Pending co-parent invitations */}
      {parentInvitations.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3 text-sm uppercase tracking-wide text-fg-muted">Pending co-parent invitations</h2>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {parentInvitations.map((inv) => (
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

      {/* Invite co-parent */}
      <section>
        <h2 className="font-display font-semibold text-fg mb-3 text-sm uppercase tracking-wide text-fg-muted">Add a co-parent</h2>
        <form
          onSubmit={handleInviteCoparent}
          className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex flex-col gap-3"
        >
          <div>
            <label className="text-xs text-fg-muted">Co-parent&apos;s Google email</label>
            <input
              type="email"
              required
              value={coparentEmail}
              onChange={(e) => setCoparentEmail(e.target.value)}
              placeholder="coparent@gmail.com"
              className="w-full mt-1 rounded-xl bg-bg border border-[var(--border)] px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-teal"
            />
          </div>
          <button
            type="submit"
            disabled={submittingCoparent || !coparentEmail.trim()}
            className="self-start rounded-xl bg-accent-teal text-black font-semibold text-sm px-4 py-2 disabled:opacity-50"
          >
            {submittingCoparent ? "Sending…" : "Send invite"}
          </button>
          <p className="text-xs text-fg-muted">
            They&apos;ll have full access to manage chores, badges, and points for everyone in this family.
          </p>
        </form>
      </section>
    </>
  );
}
