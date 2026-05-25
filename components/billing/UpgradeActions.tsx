"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Plan } from "@/lib/subscription";

/**
 * The two upgrade CTAs, shared by the UpgradeModal and the /admin/upgrade page.
 * - "Start 7-day free trial" shows only if the family never trialed before.
 * - "Upgrade to Premium" hits the placeholder billing endpoint and surfaces a
 *   graceful "coming soon" message until payments are wired up.
 */
export default function UpgradeActions({
  plan,
  onDone,
}: {
  plan: Plan;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"trial" | "upgrade" | null>(null);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startTrial() {
    setBusy("trial");
    setError(null);
    try {
      const res = await fetch("/api/parent/trial/start", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Couldn't start your trial. Please try again.");
        return;
      }
      router.refresh();
      onDone?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function upgrade() {
    setBusy("upgrade");
    setError(null);
    try {
      const res = await fetch("/api/parent/subscribe", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        comingSoon?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.comingSoon) {
        setComingSoon(data.message ?? "Paid plans are coming soon.");
        return;
      }
      router.refresh();
      onDone?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (comingSoon) {
    return (
      <div className="rounded-xl border border-accent-amber/30 bg-accent-amber/10 px-4 py-3 text-sm text-fg text-center">
        <div className="text-2xl mb-1">🚧</div>
        {comingSoon}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!plan.hasTrialedBefore && (
        <button
          type="button"
          onClick={startTrial}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 bg-accent-teal text-black font-display font-bold text-sm px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy === "trial" ? <Loader2 size={14} className="animate-spin" /> : "✨"}
          Start 7-day free trial
        </button>
      )}
      <button
        type="button"
        onClick={upgrade}
        disabled={busy !== null}
        className="flex items-center justify-center gap-2 bg-accent-amber text-black font-display font-bold text-sm px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy === "upgrade" ? <Loader2 size={14} className="animate-spin" /> : null}
        Upgrade to Premium
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
