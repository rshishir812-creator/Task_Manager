"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-sans text-fg-muted transition-colors hover:text-fg hover:border-fg focus:outline-none focus:ring-2 focus:ring-accent-teal"
      aria-label="Sign out"
    >
      <LogOut size={16} />
      Sign out
    </button>
  );
}
