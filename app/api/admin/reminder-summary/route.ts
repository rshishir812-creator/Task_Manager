import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayIST, getDayOfWeek, getChoresForDay } from "@/lib/streak-calculator";
import { getParentContext } from "@/lib/auth-scope";
import { getHolidaySetsForFamily } from "@/lib/holidays";
import type { Chore, ChoreCompletion, Profile } from "@/lib/types";

export async function GET() {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const today = getTodayIST();
  const dow = getDayOfWeek(today);

  // Scope all queries to the requester's family
  const [usersRes, choresRes, completionsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, name")
      .eq("role", "child")
      .eq("family_id", ctx.familyId),
    admin
      .from("chores")
      .select("*")
      .eq("is_active", true)
      .eq("family_id", ctx.familyId),
    admin
      .from("chore_completions")
      .select("user_id, chore_id")
      .eq("completed_date", today),
  ]);

  const users = (usersRes.data as Pick<Profile, "id" | "name">[]) ?? [];
  const todaysChores = getChoresForDay((choresRes.data as Chore[]) ?? [], dow);
  const allCompletions = (completionsRes.data as Pick<ChoreCompletion, "user_id" | "chore_id">[]) ?? [];
  const userIdSet = new Set(users.map((u) => u.id));
  const completions = allCompletions.filter((c) => userIdSet.has(c.user_id));

  // Don't nag kids who are on holiday today.
  const familyHolidays = await getHolidaySetsForFamily(ctx.familyId);

  const behind = users
    .filter((u) => !(familyHolidays.get(u.id)?.has(today)))
    .map((u) => {
      const done = new Set(
        completions.filter((c) => c.user_id === u.id).map((c) => c.chore_id)
      );
      const pendingCount = todaysChores.filter((c) => !done.has(c.id)).length;
      return { id: u.id, name: u.name ?? "Unknown", pendingCount };
    })
    .filter((u) => u.pendingCount > 0);

  return NextResponse.json({
    totalUsers: users.length,
    behindCount: behind.length,
    behindUsers: behind,
  });
}
