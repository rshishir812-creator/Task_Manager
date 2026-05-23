import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Hero from "@/components/marketing/Hero";
import TrustStrip from "@/components/marketing/TrustStrip";
import HowItWorks from "@/components/marketing/HowItWorks";
import LogoMark from "@/components/marketing/LogoMark";

interface PageProps {
  searchParams?: { error?: string };
}

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
      <main className="min-h-screen bg-bg text-fg">
        <Suspense>
          <Hero errorMsg={errorMsg} />
        </Suspense>
        <TrustStrip />
        <HowItWorks />

        <footer className="px-6 md:px-12 py-10 border-t border-[var(--border)]">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2 text-fg-muted">
              <LogoMark size={18} className="text-accent-teal" />
              <span className="font-hero text-xs tracking-[0.32em] font-semibold">
                CHOREQUEST
              </span>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-fg-muted">
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
            <p className="text-xs text-fg-muted/70">
              © {new Date().getFullYear()} ChoreQuest
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
