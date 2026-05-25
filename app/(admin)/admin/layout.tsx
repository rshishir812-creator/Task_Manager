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
import HelpButton from "@/components/walkthrough/HelpButton";
import WalkthroughManager from "@/components/walkthrough/WalkthroughManager";
import LogoMark from "@/components/marketing/LogoMark";
import TrialBanner from "@/components/billing/TrialBanner";
import { getFamilyPlan } from "@/lib/subscription";
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

  // New feedback count — only computed for super admins (nav entry hidden otherwise)
  let newFeedbackCount = 0;
  if (profile.is_super_admin) {
    const { count } = await adminClient
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    newFeedbackCount = count ?? 0;
  }

  // Subscription plan — drives nav locks + the upgrade nudge. Super admins are
  // never gated. Children never reach this layout, so no payment UI leaks to them.
  const plan = await getFamilyPlan(profile.family_id);

  return (
    <NavProgressProvider color="amber">
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 pt-safe border-b border-[var(--border)] bg-bg-elevated/90 backdrop-blur-sm">
        <span className="flex items-center gap-2 font-display text-xl font-bold text-fg">
          <LogoMark size={22} className="text-accent-teal" />
          ChoreQuest <span className="text-accent-amber text-sm font-display font-bold ml-1">Admin</span>
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <HelpButton />
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
          newFeedbackCount={newFeedbackCount}
          userEmail={profile.email}
          userName={profile.name}
          hasPremiumAccess={plan.hasPremiumAccess}
        />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <SessionWatcher />
      <AdminReminderWatcher adminId={user.id} />
      <EnableNotificationsPrompt userId={user.id} mode="admin" />
      {!profile.is_super_admin && <TrialBanner plan={plan} />}
      <WalkthroughManager role="parent" seenAt={profile.walkthrough_seen_at} />
    </div>
    </NavProgressProvider>
  );
}
