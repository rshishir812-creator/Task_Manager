import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import BadgeAdminPanel from "@/components/admin/BadgeAdminPanel";
import { getParentContext, resolveChild } from "@/lib/auth-scope";
import Link from "next/link";
import type { Badge, UserBadge } from "@/lib/types";

export default async function AdminBadgesPage({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const adminClient = createAdminClient();
  const child = await resolveChild(ctx.familyId, searchParams, ctx.isSuperAdmin);

  if (!child) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-fg">Badge Management 🏅</h1>
        <p className="text-sm text-fg-muted">No children added yet.</p>
        <Link href="/admin/family" className="text-sm text-accent-amber">Add a child →</Link>
      </div>
    );
  }

  const ridham = child;

  const [{ data: badgesData }, { data: userBadgesData }] = await Promise.all([
    adminClient.from("badges").select("*").eq("family_id", ctx.familyId).order("badge_type").order("threshold"),
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
