import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import BadgeTile from "@/components/gamification/BadgeTile";
import type { Badge, UserBadge } from "@/lib/types";

export default async function BadgesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const [{ data: badgesData }, { data: userBadgesData }] = await Promise.all([
    adminClient.from("badges").select("*").order("badge_type").order("threshold"),
    adminClient.from("user_badges").select("*").eq("user_id", user.id),
  ]);

  const badges = (badgesData as Badge[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];
  const earnedMap = new Map(userBadges.map((ub) => [ub.badge_id, ub]));
  const earnedCount = userBadges.length;

  const grouped = {
    special: badges.filter((b) => b.badge_type === "special"),
    streak: badges.filter((b) => b.badge_type === "streak" && b.chore_id === null),
    milestone: badges.filter((b) => b.badge_type === "streak" && b.chore_id !== null),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Badge Cabinet 🏆</h1>
        <p className="text-sm text-fg-muted mt-1">
          {earnedCount} / {badges.length} earned
        </p>
      </div>

      {grouped.special.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3">✨ Special Badges</h2>
          <div className="grid grid-cols-3 gap-3">
            {grouped.special.map((b) => (
              <BadgeTile key={b.id} badge={b} userBadge={earnedMap.get(b.id)} />
            ))}
          </div>
        </section>
      )}

      {grouped.streak.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3">🔥 Daily Streak</h2>
          <div className="grid grid-cols-4 gap-2">
            {grouped.streak.map((b) => (
              <BadgeTile key={b.id} badge={b} userBadge={earnedMap.get(b.id)} />
            ))}
          </div>
        </section>
      )}

      {grouped.milestone.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3">🎯 Per-Chore Streaks</h2>
          <div className="grid grid-cols-4 gap-2">
            {grouped.milestone.map((b) => (
              <BadgeTile key={b.id} badge={b} userBadge={earnedMap.get(b.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
