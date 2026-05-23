"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    if (isLoading) return;
    setIsLoading(true);

    // Tell SessionWatcher this is an intentional sign-out so it doesn't
    // flash a "Session expired" toast while we navigate away.
    try {
      sessionStorage.setItem("chorequest:intentional-signout", "1");
    } catch {
      // sessionStorage can throw in some embedded contexts — ignore.
    }

    const supabase = createClient();
    await supabase.auth.signOut();

    // Hard redirect so the React tree (and any cached server data) is fully
    // torn down — back button can't return to an authenticated page.
    window.location.replace("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      aria-busy={isLoading}
      className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-sans text-fg-muted transition-colors hover:text-fg hover:border-fg disabled:cursor-wait disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent-teal"
      aria-label="Sign out"
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          <span>Signing out…</span>
        </>
      ) : (
        <>
          <LogOut size={16} aria-hidden="true" />
          <span>Sign out</span>
        </>
      )}
    </button>
  );
}
