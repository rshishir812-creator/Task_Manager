import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/ui/SignOutButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/ui/PageTransition";
import { NavProgressProvider } from "@/components/ui/NavProgress";
import Image from "next/image";
import type { Profile } from "@/lib/types";

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
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-bg-elevated/90 backdrop-blur-sm">
        <span className="font-display text-xl font-bold text-fg">🎮 ChoreQuest</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {profile?.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={profile.name ?? "Avatar"}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        <PageTransition>{children}</PageTransition>
      </main>

      <BottomNav />
    </div>
    </NavProgressProvider>
  );
}
