"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeroProps {
  errorMsg: string | null;
}

type Intent = "parent" | "child";

export default function Hero({ errorMsg }: HeroProps) {
  const [loading, setLoading] = useState<Intent | null>(null);

  async function handleGoogleSignIn(intent: Intent) {
    if (loading) return;
    setLoading(intent);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?intent=${intent}`,
          // Always show Google's account chooser so the right person can pick
          // their own account on a shared device (otherwise Google silently
          // reuses whoever is already signed in).
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        setLoading(null);
      }
      // On success, the browser is navigating to Google — keep the loading
      // state until the redirect tears the page down.
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col">
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {decodeURIComponent(errorMsg)}
        </div>
      )}

      <h1 className="font-hero font-extrabold text-fg text-balance leading-[0.95] tracking-tight text-[clamp(2rem,7vw,4.75rem)]">
        Make chores
        <br />
        <span className="text-accent-teal">a quest.</span> Not a fight.
      </h1>

      <p className="mt-5 text-fg-muted leading-relaxed text-[clamp(0.95rem,2vw,1.125rem)]">
        ChoreQuest turns daily habits into a game your kids actually want to play.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <button
          onClick={() => handleGoogleSignIn("parent")}
          disabled={loading !== null}
          aria-busy={loading === "parent"}
          className="w-full flex items-center justify-center gap-3 rounded-full bg-accent-teal text-black font-hero font-extrabold text-base md:text-lg px-8 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] disabled:cursor-wait disabled:hover:scale-100 disabled:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2 focus:ring-offset-bg"
        >
          {loading === "parent" ? (
            <>
              <Loader2 size={20} className="animate-spin" aria-hidden="true" />
              <span>Connecting…</span>
            </>
          ) : (
            <>
              <span>I&apos;m a Parent</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleGoogleSignIn("child")}
          disabled={loading !== null}
          aria-busy={loading === "child"}
          className="w-full flex items-center justify-center gap-3 rounded-full border-2 border-accent-teal text-fg font-hero font-extrabold text-base md:text-lg px-8 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] disabled:cursor-wait disabled:hover:scale-100 disabled:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2 focus:ring-offset-bg"
        >
          {loading === "child" ? (
            <>
              <Loader2 size={20} className="animate-spin" aria-hidden="true" />
              <span>Connecting…</span>
            </>
          ) : (
            <>
              <span>I&apos;m a Kid</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        <p className="mt-1 text-center text-xs text-fg-muted/70 leading-relaxed">
          <span className="text-fg-muted">Parents:</span> first time? You&apos;ll start your own family.
          <br />
          <span className="text-fg-muted">Kids:</span> ask a parent to invite your email first.
        </p>
      </div>
    </div>
  );
}
