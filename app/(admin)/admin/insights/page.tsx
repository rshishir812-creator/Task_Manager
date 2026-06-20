import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTodayIST } from "@/lib/streak-calculator";
import { getParentContext, getChildrenOfFamily } from "@/lib/auth-scope";
import { getHolidaySetsForFamily } from "@/lib/holidays";
import { getFamilyPlan } from "@/lib/subscription";
import PremiumLocked from "@/components/billing/PremiumLocked";
import {
  computeFamilyScore,
  computeChampionOfWeek,
  computeKidsTodayStatus,
  computePerChildSparkline,
  computeChoreDifficultyStats,
} from "@/lib/insights";
import FamilyPulseStrip from "@/components/admin/FamilyPulseStrip";
import ChampionBanner from "@/components/admin/ChampionBanner";
import PerChildSparkline from "@/components/admin/PerChildSparkline";
import ChoreDifficultyTable from "@/components/admin/ChoreDifficultyTable";
import type {
  Chore,
  ChoreAssignment,
  ChoreCompletion,
  UserBadge,
} from "@/lib/types";

export default async function InsightsPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const plan = await getFamilyPlan(ctx.familyId);
  if (!plan.hasPremiumAccess && !ctx.isSuperAdmin) {
    return (
      <PremiumLocked
        feature="Insights"
        icon="📈"
        description="See your family's completion trends, weekly champion, and which chores need attention."
        plan={plan}
      />
    );
  }

  const adminClient = createAdminClient();
  const kids = await getChildrenOfFamily(ctx.familyId);
  const today = getTodayIST();
  const familyHolidays = await getHolidaySetsForFamily(ctx.familyId);

  if (kids.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-fg">Family Insights 📈</h1>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-8 text-center">
          <p className="text-fg-muted mb-4">No children added yet.</p>
          <Link
            href="/admin/family"
            className="inline-block rounded-xl bg-accent-amber/20 text-accent-amber px-4 py-2 text-sm font-semibold hover:bg-accent-amber/40 transition-colors"
          >
            Add your first child →
          </Link>
        </div>
      </div>
    );
  }

  const [{ data: allChoresData }, ...kidQueries] = await Promise.all([
    adminClient
      .from("chores")
      .select("*")
      .eq("family_id", ctx.familyId)
      .order("sort_order"),
    ...kids.map((kid) =>
      Promise.all([
        adminClient.from("chore_completions").select("*").eq("user_id", kid.id),
        adminClient.from("chore_assignments").select("*").eq("user_id", kid.id),
        adminClient.from("user_badges").select("*").eq("user_id", kid.id),
      ]).then(([comps, assigns, badges]) => ({
        kid,
        completions: (comps.data as ChoreCompletion[] | null) ?? [],
        assignments: (assigns.data as ChoreAssignment[] | null) ?? [],
        badges: (badges.data as UserBadge[] | null) ?? [],
      })),
    ),
  ]);

  const allChores = (allChoresData as Chore[] | null) ?? [];

  const kidsData = kidQueries.map((k) => {
    const assignedIds = new Set(k.assignments.map((a) => a.chore_id));
    return {
      profile: k.kid,
      completions: k.completions,
      chores: allChores.filter((c) => assignedIds.has(c.id)),
      assignments: k.assignments,
      badges: k.badges,
      holidays: familyHolidays.get(k.kid.id) ?? new Set<string>(),
    };
  });

  const familyScore = computeFamilyScore(kidsData, today);
  const champion = computeChampionOfWeek(kidsData, today);
  const todayStatus = computeKidsTodayStatus(kidsData, today);

  // Active alert
  let alert: string | null = null;
  for (const k of kidsData) {
    const pending = k.completions.filter((c) => c.status === "pending");
    if (pending.length > 0) {
      const first = pending[0]!;
      const ageHours = first.completed_at
        ? (Date.now() - new Date(first.completed_at).getTime()) / 3600000
        : 0;
      if (ageHours > 24) {
        alert = `${k.profile.name?.split(" ")[0] ?? "A kid"} has a chore waiting > 24h for approval`;
        break;
      }
    }
  }

  // Per-child sparklines
  const sparklines = kidsData.map((k) => ({
    kid: k.profile,
    points: computePerChildSparkline(k.completions, k.chores, k.assignments, today, 8, k.holidays),
  }));

  // Chore health — aggregate all completions across all kids for the shared chore catalog
  const allCompletions: ChoreCompletion[] = kidsData.flatMap((k) => k.completions);
  const allAssignments: ChoreAssignment[] = kidsData.flatMap((k) => k.assignments);
  const difficultyStats = computeChoreDifficultyStats(
    allChores.filter((c) => c.is_active),
    allCompletions,
    allAssignments,
    today,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Family Insights 📈</h1>
        <p className="text-sm text-fg-muted mt-1">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <FamilyPulseStrip score={familyScore} todayStatus={todayStatus} alert={alert} />

      <ChampionBanner champion={champion} />

      {/* Per-child trend sparklines */}
      {sparklines.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-fg mb-3">📉 Trends</h2>
          <div className={`grid gap-3 ${sparklines.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
            {sparklines.map(({ kid, points }) => (
              <PerChildSparkline key={kid.id} kid={kid} points={points} />
            ))}
          </div>
        </div>
      )}

      {/* Chore health / difficulty table */}
      <ChoreDifficultyTable stats={difficultyStats} />
    </div>
  );
}
