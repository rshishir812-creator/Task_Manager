"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Profile, ChildInvitation } from "@/lib/types";
import type { Plan } from "@/lib/subscription";
import { FREE_LIMITS } from "@/lib/plan-limits";
import UpgradeModal from "@/components/billing/UpgradeModal";

interface FamilyPanelProps {
  initialChildren: Profile[];
  initialInvitations: ChildInvitation[];
  plan: Plan;
  isSuperAdmin: boolean;
}

export default function FamilyPanel({ initialChildren, initialInvitations, plan, isSuperAdmin }: FamilyPanelProps) {
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
  const [pendingChild, setPendingChild] = useState<{ name: string; email: string } | null>(null);
  const [pendingCoparent, setPendingCoparent] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const childInvitations = invitations.filter((i) => i.role !== "parent");
  const parentInvitations = invitations.filter((i) => i.role === "parent");

  // Premium gating (super admins are never gated).
  const premium = plan.hasPremiumAccess || isSuperAdmin;
  const childCount = children.length + childInvitations.length;
  const childLimitReached = !premium && childCount >= FREE_LIMITS.maxChildren;
  const coparentLocked = !premium;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleChildSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    setPendingChild({ name: name.trim(), email: trimmedEmail });
  }

  async function confirmChildInvite() {
    if (!pendingChild) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pendingChild.name || null, email: pendingChild.email }),
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
        setPendingChild(null);
        showToast("✅ Child invitation sent. Ask them to sign in with Google.");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCoparentSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = coparentEmail.trim();
    if (!trimmedEmail) return;
    setPendingCoparent(trimmedEmail);
  }

  async function confirmCoparentInvite() {
    if (!pendingCoparent) return;
    setSubmittingCoparent(true);
    try {
      const res = await fetch("/api/parent/coparent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingCoparent }),
      });
      const data = await res.json() as { invitation?: ChildInvitation; error?: string };
      if (!res.ok) {
        showToast(data.error ?? "Failed to invite");
        return;
      }
      if (data.invitation) {
        setInvitations((prev) => [data.invitation!, ...prev]);
        setCoparentEmail("");
        setPendingCoparent(null);
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
      {children.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3 text-sm uppercase tracking-wide text-fg-muted">Children</h2>
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
          <p className="text-xs text-fg-muted mt-2">
            Removing a child deletes their streaks, badges, and history. Their Google account is not affected.
          </p>
        </section>
      )}

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

      {/* Add a child — primary, accent-teal */}
      <section>
        <div className="rounded-2xl border-2 border-accent-teal/40 bg-bg-elevated overflow-hidden">
          <div className="bg-accent-teal/10 px-5 py-4 flex items-center gap-3 border-b border-accent-teal/20">
            <span className="text-3xl">👶</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-fg text-base">Add a child</h2>
                <span className="text-[10px] font-bold tracking-wider bg-accent-teal/20 text-accent-teal px-2 py-0.5 rounded-full">CHILD</span>
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                Kid-friendly dashboard, earns points, unlocks rewards.
              </p>
            </div>
          </div>

          {childLimitReached ? (
            <div className="p-5 flex flex-col gap-3 items-start">
              <p className="text-sm text-fg leading-relaxed">
                <span className="font-semibold">🔒 Premium</span> — the Free plan includes {FREE_LIMITS.maxChildren} child.
                Upgrade to add more of your family.
              </p>
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="rounded-xl bg-accent-amber text-black font-semibold text-sm px-4 py-2"
              >
                Upgrade to add more
              </button>
            </div>
          ) : pendingChild ? (
            <div className="p-5 flex flex-col gap-3">
              <p className="text-sm text-fg leading-relaxed">
                Invite <span className="font-semibold text-accent-teal">{pendingChild.email}</span> as a <span className="font-semibold">child</span> in your family?
              </p>
              <p className="text-xs text-fg-muted">
                They&apos;ll see the kid dashboard and earn points for chores. To make them a parent instead, cancel and use the &ldquo;Add a co-parent&rdquo; card below.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPendingChild(null)}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-fg-muted hover:bg-bg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmChildInvite}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-accent-teal text-black font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Yes, invite as child"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChildSubmit} className="p-5 flex flex-col gap-3">
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
                <label className="text-xs text-fg-muted">Child&apos;s Google email</label>
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
                disabled={!email.trim()}
                className="self-start rounded-xl bg-accent-teal text-black font-semibold text-sm px-4 py-2 disabled:opacity-50"
              >
                Send invite to my child
              </button>
              <p className="text-xs text-fg-muted leading-relaxed">
                They&apos;ll be added when they sign in with Google using this email. If you mistype, they&apos;ll start their own family by accident — double-check before sending.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Add a co-parent — secondary, accent-amber */}
      <section>
        <div className="rounded-2xl border-2 border-accent-amber/40 bg-bg-elevated overflow-hidden">
          <div className="bg-accent-amber/10 px-5 py-4 flex items-center gap-3 border-b border-accent-amber/20">
            <span className="text-3xl">👨‍👩‍👧</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-fg text-base">Add a co-parent or guardian</h2>
                <span className="text-[10px] font-bold tracking-wider bg-accent-amber/20 text-accent-amber px-2 py-0.5 rounded-full">ADULT</span>
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                Another adult who&apos;ll manage chores and approve completions with you.
              </p>
            </div>
          </div>

          {coparentLocked ? (
            <div className="p-5 flex flex-col gap-3 items-start">
              <p className="text-sm text-fg leading-relaxed">
                <span className="font-semibold">🔒 Premium</span> — adding a co-parent or guardian is a Premium feature.
              </p>
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="rounded-xl bg-accent-amber text-black font-semibold text-sm px-4 py-2"
              >
                Upgrade to add a co-parent
              </button>
            </div>
          ) : pendingCoparent ? (
            <div className="p-5 flex flex-col gap-3">
              <p className="text-sm text-fg leading-relaxed">
                Invite <span className="font-semibold text-accent-amber">{pendingCoparent}</span> as a <span className="font-semibold">co-parent</span> (adult)?
              </p>
              <p className="text-xs text-fg-muted">
                They&apos;ll have full admin access — manage chores, approve completions, award points. Only confirm if this is another adult, not a child.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPendingCoparent(null)}
                  disabled={submittingCoparent}
                  className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-fg-muted hover:bg-bg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCoparentInvite}
                  disabled={submittingCoparent}
                  className="flex-1 rounded-xl bg-accent-amber text-black font-semibold text-sm px-4 py-2.5 disabled:opacity-50"
                >
                  {submittingCoparent ? "Sending…" : "Yes, invite as co-parent"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCoparentSubmit} className="p-5 flex flex-col gap-3">
              <div>
                <label className="text-xs text-fg-muted">Co-parent&apos;s Google email</label>
                <input
                  type="email"
                  required
                  value={coparentEmail}
                  onChange={(e) => setCoparentEmail(e.target.value)}
                  placeholder="coparent@gmail.com"
                  className="w-full mt-1 rounded-xl bg-bg border border-[var(--border)] px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-amber"
                />
              </div>
              <button
                type="submit"
                disabled={!coparentEmail.trim()}
                className="self-start rounded-xl border-2 border-accent-amber text-accent-amber font-semibold text-sm px-4 py-2 hover:bg-accent-amber/10 disabled:opacity-50"
              >
                Invite as co-parent
              </button>
              <p className="text-xs text-fg-muted leading-relaxed">
                Use this <span className="font-semibold text-fg">only for another adult</span>. Don&apos;t put your child&apos;s email here — they&apos;d become a parent of the family by mistake.
              </p>
            </form>
          )}
        </div>
      </section>

      {upgradeOpen && <UpgradeModal plan={plan} onClose={() => setUpgradeOpen(false)} />}
    </>
  );
}
