import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BadgeAdminPanel from "@/components/admin/BadgeAdminPanel";
import type { Badge, Profile, UserBadge } from "@/lib/types";

export default async function AdminBadgesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const { data: profileData } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single() as { data: Pick<Profile, "role"> | null; error: unknown };
  if (profileData?.role !== "admin") redirect("/dashboard");

  const { data: profilesData } = await adminClient.from("profiles").select("*");
  const profiles = (profilesData as Profile[] | null) ?? [];
  const ridham = profiles.find((p) => p.role === "user");

  if (!ridham) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-fg">Badge Management 🏅</h1>
        <p className="text-sm text-fg-muted">No user account found yet.</p>
      </div>
    );
  }

  const [{ data: badgesData }, { data: userBadgesData }] = await Promise.all([
    adminClient.from("badges").select("*").order("badge_type").order("threshold"),
    adminClient.from("user_badges").select("*").eq("user_id", ridham.id),
  ]);

  const badges = (badgesData as Badge[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Badge Management 🏅</h1>
        <p className="text-sm text-fg-muted mt-1">
          {ridham.name?.split(" ")[0] ?? "Ridham"}&apos;s badges — award manually or track progress
        </p>
      </div>
      <BadgeAdminPanel badges={badges} userBadges={userBadges} userId={ridham.id} />
    </div>
  );
}
