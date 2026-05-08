import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/layout/AdminNav";
import SignOutButton from "@/components/ui/SignOutButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Image from "next/image";
import type { Profile } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await createAdminClient()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-bg-elevated/90 backdrop-blur-sm">
        <span className="font-display text-xl font-bold text-fg">🛡️ ChoreQuest Admin</span>
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
          <span className="text-xs text-accent-amber font-semibold hidden sm:block">
            {profile?.name?.split(" ")[0]}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1">
        <AdminNav />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
