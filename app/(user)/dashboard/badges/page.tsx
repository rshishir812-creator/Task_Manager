import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import BadgeTile from "@/components/gamification/BadgeTile";
import { computeMilestones } from "@/lib/milestone-calculator";
import { getTodayIST } from "@/lib/streak-calculator";
import type { Badge, Chore, ChoreCompletion, UserBadge } from "@/lib/types";

export default async function BadgesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const [
    { data: badgesData },
    { data: userBadgesData },
    { data: choresData },
    { data: completionsData },
  ] = await Promise.all([
    adminClient.from("badges").select("*").order("badge_type").order("threshold"),
    adminClient.from("user_badges").select("*").eq("user_id", user.id),
    adminClient.from("chores").select("*").eq("is_active", true),
    adminClient.from("chore_completions").select("*").eq("user_id", user.id),
  ]);

  const badges = (badgesData as Badge[] | null) ?? [];
  const userBadges = (userBadgesData as UserBadge[] | null) ?? [];
  const chores = (choresData as Chore[] | null) ?? [];
  const completions = (completionsData as ChoreCompletion[] | null) ?? [];
  const earnedMap = new Map(userBadges.map((ub) => [ub.badge_id, ub]));
  const earnedCount = userBadges.length;

  const progressMap = new Map(
    computeMilestones({
      badges,
      userBadges,
      chores,
      completions,
      today: getTodayIST(),
    }).map((m) => [m.badge.id, m.progressFraction])
  );

  const grouped = {
    special: badges.filter((b) => b.badge_type === "special"),
    overall: badges.filter((b) => b.badge_type === "streak" && b.chore_id === null),
    perchore: badges.filter((b) => b.badge_type === "streak" && b.chore_id !== null),
    award: badges.filter((b) => b.badge_type === "milestone"),
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
              <BadgeTile key={b.id} badge={b} userBadge={earnedMap.get(b.id)} progress={progressMap.get(b.id)} />
            ))}
          </div>
        </section>
      )}

      {grouped.overall.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3">🔥 Daily Streak</h2>
          <div className="grid grid-cols-4 gap-2">
            {grouped.overall.map((b) => (
              <BadgeTile key={b.id} badge={b} userBadge={earnedMap.get(b.id)} progress={progressMap.get(b.id)} />
            ))}
          </div>
        </section>
      )}

      {grouped.perchore.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3">🎯 Per-Chore Streaks</h2>
          <div className="grid grid-cols-4 gap-2">
            {grouped.perchore.map((b) => (
              <BadgeTile key={b.id} badge={b} userBadge={earnedMap.get(b.id)} progress={progressMap.get(b.id)} />
            ))}
          </div>
        </section>
      )}

      {grouped.award.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-fg mb-3">🏆 Awards</h2>
          <div className="grid grid-cols-3 gap-3">
            {grouped.award.map((b) => (
              <BadgeTile key={b.id} badge={b} userBadge={earnedMap.get(b.id)} progress={progressMap.get(b.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
