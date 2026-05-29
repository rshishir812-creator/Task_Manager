"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Loader2 } from "lucide-react";

/**
 * Signs the current user out and returns to /login, where they can pick a
 * different Google account (the login buttons force the account chooser).
 * This is the "change profile" path on a shared device — mirrors
 * SignOutButton's intentional-signout handling.
 */
export default function SwitchAccountButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSwitch() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      sessionStorage.setItem("chorequest:intentional-signout", "1");
    } catch {
      // sessionStorage can throw in some embedded contexts — ignore.
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={isLoading}
      aria-busy={isLoading}
      className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-sans text-fg-muted transition-colors hover:text-fg hover:border-fg disabled:cursor-wait disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent-teal"
      aria-label="Switch account"
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          <span>Switching…</span>
        </>
      ) : (
        <>
          <Users size={16} aria-hidden="true" />
          <span>Switch account</span>
        </>
      )}
    </button>
  );
}
