import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AccessDeniedPage() {
  // Sign out any lingering session
  const supabase = createClient();
  await supabase.auth.signOut();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="max-w-sm flex flex-col items-center gap-6">
        <div className="text-6xl">🚫</div>
        <h1 className="font-display text-3xl font-bold text-fg">
          Access Denied
        </h1>
        <p className="font-sans text-fg-muted text-sm leading-relaxed">
          This Google account couldn&apos;t be authorized.
          <br />
          Try signing in again, or ask your family&apos;s parent to invite this email.
        </p>
        <Link
          href="/login"
          className="rounded-2xl bg-accent-teal text-[#0B0F2A] font-sans font-semibold px-6 py-3 text-sm transition-opacity hover:opacity-90"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
