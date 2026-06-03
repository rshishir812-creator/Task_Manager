import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileMenu from "@/components/ui/ProfileMenu";
import WalkthroughManager from "@/components/walkthrough/WalkthroughManager";
import LogoMark from "@/components/marketing/LogoMark";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/ui/PageTransition";
import { NavProgressProvider } from "@/components/ui/NavProgress";
import SessionWatcher from "@/components/auth/SessionWatcher";
import ReminderManager from "@/components/notifications/ReminderManager";
import EnableNotificationsPrompt from "@/components/notifications/EnableNotificationsPrompt";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import type { Profile } from "@/lib/types";

// Auth-walled, but defensive noindex prevents accidental indexing of any leaked link.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as { data: Profile | null; error: unknown };

  return (
    <NavProgressProvider color="teal">
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 pt-safe border-b border-[var(--border)] bg-bg-elevated/90 backdrop-blur-sm">
        <span className="flex items-center gap-2 font-display text-xl font-bold text-fg">
          <LogoMark size={22} className="text-accent-teal" />
          ChoreQuest
        </span>
        <ProfileMenu
          avatarUrl={profile?.avatar_url ?? null}
          name={profile?.name ?? null}
          email={profile?.email ?? null}
          accent="teal"
        />
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        <PageTransition>{children}</PageTransition>
      </main>

      <BottomNav />
      <SessionWatcher />
      <ReminderManager userId={user.id} />
      <EnableNotificationsPrompt userId={user.id} />
      <InstallAppPrompt accent="teal" />
      <WalkthroughManager role="child" seenAt={profile?.walkthrough_seen_at ?? null} />
    </div>
    </NavProgressProvider>
  );
}
