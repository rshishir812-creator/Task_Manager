import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Hero from "@/components/marketing/Hero";
import LogoMark from "@/components/marketing/LogoMark";
import { SITE_NAME } from "@/lib/marketing/site";

interface PageProps {
  searchParams?: { error?: string };
}

export const metadata: Metadata = {
  title: `Sign in to ${SITE_NAME}`,
  description: `Sign in to ${SITE_NAME} with Google. Parents create their family; kids join with their own Google account.`,
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
};

export default async function LoginPage({ searchParams }: PageProps) {
  // Auth redirect guard — signed-in users skip the marketing page.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await createAdminClient()
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "child") redirect("/dashboard");
    redirect("/admin/dashboard");
  }

  const errorMsg = searchParams?.error ?? null;

  return (
    // Force dark mode on the landing regardless of user preference.
    <div className="dark">
      <main className="relative h-[100dvh] overflow-hidden bg-bg text-fg flex flex-col px-6 md:px-12 py-6 pt-safe pb-safe">
        {/* Subtle accent vignette */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.18]"
          style={{
            background:
              "radial-gradient(closest-side, var(--accent-teal), transparent)",
          }}
          aria-hidden="true"
        />

        {/* Top: wordmark */}
        <header className="relative flex items-center gap-2 text-fg-muted shrink-0">
          <LogoMark size={20} className="text-accent-teal" />
          <span className="font-hero text-xs tracking-[0.32em] font-semibold">
            CHOREQUEST
          </span>
        </header>

        {/* Middle: hero, vertically centred */}
        <section className="relative flex-1 flex items-center justify-center min-h-0">
          <Suspense>
            <Hero errorMsg={errorMsg} />
          </Suspense>
        </section>

        {/* Bottom: trust pill row + legal footer */}
        <footer className="relative shrink-0 flex flex-col items-center gap-3 text-center">
          <div className="text-[11px] md:text-xs text-fg-muted/80 leading-relaxed">
            🔒 COPPA-compliant
            <span className="text-fg-muted/40 mx-2">·</span>
            🚫 No ads, no tracking
            <span className="text-fg-muted/40 mx-2">·</span>
            🆓 Free for the whole family
          </div>
          <div className="flex gap-5 text-[11px] text-fg-muted/70">
            <Link href="/legal/privacy" className="hover:text-fg transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-fg transition-colors">
              Terms
            </Link>
            <Link href="/legal/notices" className="hover:text-fg transition-colors">
              Open source
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
