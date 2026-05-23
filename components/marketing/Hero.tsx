"use client";

import { createClient } from "@/lib/supabase/client";
import LogoMark from "./LogoMark";

interface HeroProps {
  errorMsg: string | null;
}

export default function Hero({ errorMsg }: HeroProps) {
  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <section className="relative min-h-screen flex flex-col px-6 md:px-12 pt-6 pb-12 overflow-hidden">
      {/* Subtle accent vignette */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.18]"
        style={{
          background:
            "radial-gradient(closest-side, var(--accent-teal), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Top wordmark */}
      <div className="relative flex items-center gap-2 text-fg-muted">
        <LogoMark size={20} className="text-accent-teal" />
        <span className="font-hero text-xs tracking-[0.32em] font-semibold">
          CHOREQUEST
        </span>
      </div>

      {/* Hero block */}
      <div className="relative flex-1 flex flex-col justify-center max-w-3xl mt-16 md:mt-24">
        {errorMsg && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 max-w-md">
            {decodeURIComponent(errorMsg)}
          </div>
        )}

        <h1 className="font-hero font-extrabold text-fg text-balance leading-[0.95] tracking-tight text-[clamp(2.75rem,9vw,5.5rem)]">
          Make chores
          <br />
          <span className="text-accent-teal">a quest.</span> Not a fight.
        </h1>

        <p className="mt-8 text-fg-muted text-base md:text-lg leading-relaxed max-w-md">
          ChoreQuest turns daily habits into a game your kids actually want to play.
        </p>

        <div className="mt-10 max-w-md">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 rounded-full bg-accent-teal text-black font-hero font-extrabold text-lg px-8 py-5 transition-transform hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2 focus:ring-offset-bg"
          >
            Start free
            <span aria-hidden="true">→</span>
          </button>

          <button
            onClick={handleGoogleSignIn}
            className="w-full mt-5 text-sm text-fg-muted hover:text-fg transition-colors font-hero font-medium"
          >
            I already have an account
          </button>
        </div>

        <p className="mt-12 text-xs text-fg-muted/70 max-w-md leading-relaxed">
          Free for the whole family. Sign in with Google. We&apos;ll guide you through setup.
        </p>
      </div>
    </section>
  );
}
