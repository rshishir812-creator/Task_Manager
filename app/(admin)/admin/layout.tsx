import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/layout/AdminNav";
import { NavProgressProvider } from "@/components/ui/NavProgress";
import SessionWatcher from "@/components/auth/SessionWatcher";
import AdminReminderWatcher from "@/components/notifications/AdminReminderWatcher";
import EnableNotificationsPrompt from "@/components/notifications/EnableNotificationsPrompt";
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
  if (!profile) redirect("/login");
  if (profile.role !== "parent" && !profile.is_super_admin) redirect("/dashboard");

  // Pending redemption badge count for the nav
  const { count: pendingCount } = await createAdminClient()
    .from("redemptions")
    .select("id", { count: "exact", head: true })
    .eq("family_id", profile.family_id)
    .eq("status", "pending");

  // Pending verification count — chore_completions across all this family's
  // children that need parent sign-off
  const adminClient = createAdminClient();
  const { data: kidIdRows } = await adminClient
    .from("profiles")
    .select("id")
    .eq("family_id", profile.family_id)
    .eq("role", "child");
  const kidIds = ((kidIdRows as { id: string }[] | null) ?? []).map((r) => r.id);
  let pendingVerificationCount = 0;
  if (kidIds.length > 0) {
    const { count } = await adminClient
      .from("chore_completions")
      .select("id", { count: "exact", head: true })
      .in("user_id", kidIds)
      .eq("status", "pending");
    pendingVerificationCount = count ?? 0;
  }

  return (
    <NavProgressProvider color="amber">
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
        <AdminNav
          isSuperAdmin={profile.is_super_admin}
          pendingRedemptionCount={pendingCount ?? 0}
          pendingVerificationCount={pendingVerificationCount}
        />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <SessionWatcher />
      <AdminReminderWatcher adminId={user.id} />
      <EnableNotificationsPrompt userId={user.id} mode="admin" />
    </div>
    </NavProgressProvider>
  );
}
