"use client";

import { createClient } from "@/lib/supabase/client";

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

      <div className="mt-7">
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 rounded-full bg-accent-teal text-black font-hero font-extrabold text-base md:text-lg px-8 py-4 transition-transform hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2 focus:ring-offset-bg"
        >
          Start free
          <span aria-hidden="true">→</span>
        </button>

        <button
          onClick={handleGoogleSignIn}
          className="w-full mt-4 text-sm text-fg-muted hover:text-fg transition-colors font-hero font-medium"
        >
          I already have an account
        </button>
      </div>
    </div>
  );
}
