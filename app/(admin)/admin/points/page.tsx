import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PointsOverridePanel from "@/components/admin/PointsOverridePanel";
import type { ChoreCompletion, DailyBonus, Profile } from "@/lib/types";

export default async function AdminPointsPage() {
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
        <h1 className="font-display font-bold text-2xl text-fg">Points Override 💰</h1>
        <p className="text-sm text-fg-muted">No user account found yet.</p>
      </div>
    );
  }

  const [{ data: completionsData }, { data: bonusesData }] = await Promise.all([
    adminClient.from("chore_completions").select("points_earned").eq("user_id", ridham.id),
    adminClient.from("daily_bonuses").select("*").eq("user_id", ridham.id),
  ]);

  const completions = (completionsData as Pick<ChoreCompletion, "points_earned">[] | null) ?? [];
  const bonuses = (bonusesData as DailyBonus[] | null) ?? [];

  const totalPoints =
    completions.reduce((s, c) => s + (c.points_earned ?? 0), 0) +
    bonuses.reduce((s, b) => s + b.points_bonus, 0);

  // Manual overrides are stored with dates >= 9000-01-01
  const overrides = bonuses
    .filter((b) => b.bonus_date >= "9000-01-01")
    .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime());

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Points Override 💰</h1>
        <p className="text-sm text-fg-muted mt-1">
          Award bonus or deduct points from {ridham.name?.split(" ")[0] ?? "Ridham"}&apos;s total
        </p>
      </div>
      <PointsOverridePanel
        userId={ridham.id}
        userName={ridham.name?.split(" ")[0] ?? "Ridham"}
        totalPoints={totalPoints}
        initialOverrides={overrides}
      />
    </div>
  );
}
