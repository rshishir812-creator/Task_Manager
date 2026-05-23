"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PrivacyConsentPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    if (!checked) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/privacy-consent", { method: "POST" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/admin/family");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="font-display font-bold text-2xl text-fg">
            Your family&apos;s privacy matters
          </h1>
          <p className="text-sm text-fg-muted mt-2">
            Before you set up your family, please take a moment to understand
            how we handle your data.
          </p>
        </div>

        {/* Summary cards */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">📦</span>
            <div>
              <p className="font-semibold text-sm text-fg">What we collect</p>
              <p className="text-xs text-fg-muted mt-0.5">
                Parent name and email (from Google). Child name, age bracket, and chore
                activity (completion history, streaks, points, badges). Nothing more.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">🚫</span>
            <div>
              <p className="font-semibold text-sm text-fg">What we never do</p>
              <p className="text-xs text-fg-muted mt-0.5">
                We never sell, share, or use your family&apos;s data for advertising.
                No third-party trackers. No data brokers. Your data stays in your family.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">🏛️</span>
            <div>
              <p className="font-semibold text-sm text-fg">Where it&apos;s stored</p>
              <p className="text-xs text-fg-muted mt-0.5">
                Hosted on Supabase (SOC 2 certified, encrypted at rest) and Vercel.
                Family data is isolated — only your family can see it.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">🗑️</span>
            <div>
              <p className="font-semibold text-sm text-fg">You stay in control</p>
              <p className="text-xs text-fg-muted mt-0.5">
                Remove any child&apos;s data at any time from Family settings. To delete your
                entire account and all data, email us and we&apos;ll do it within 30 days.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-accent-teal/20 bg-accent-teal/5 p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">👨‍👩‍👧</span>
            <div>
              <p className="font-semibold text-sm text-fg">COPPA compliance</p>
              <p className="text-xs text-fg-muted mt-0.5">
                You, as the parent or guardian, are responsible for authorising the use of
                ChoreQuest on behalf of your children. We collect child data only after
                you give consent here.
              </p>
            </div>
          </div>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-[var(--accent-teal)] flex-shrink-0 cursor-pointer"
          />
          <span className="text-sm text-fg">
            I have read and agree to ChoreQuest&apos;s{" "}
            <Link href="/legal/privacy" target="_blank" className="text-accent-teal underline hover:opacity-80">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/legal/terms" target="_blank" className="text-accent-teal underline hover:opacity-80">
              Terms of Service
            </Link>
            . I consent to ChoreQuest collecting and storing my family&apos;s data as described above,
            and I confirm I am the parent or legal guardian of any children I add to this account.
          </span>
        </label>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleAccept}
          disabled={!checked || loading}
          className="w-full rounded-2xl bg-accent-teal text-black font-display font-bold text-base px-6 py-4 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : "I agree — let's set up my family"}
        </button>

        <p className="text-center text-xs text-fg-muted mt-4">
          By continuing you acknowledge your consent is recorded with a timestamp.
        </p>

      </div>
    </main>
  );
}
