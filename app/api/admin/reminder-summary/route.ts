import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayIST, getDayOfWeek, getChoresForDay } from "@/lib/streak-calculator";
import type { Chore, ChoreCompletion, Profile } from "@/lib/types";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await createAdminClient()
    .from("profiles").select("role").eq("id", user.id).single() as { data: Pick<Profile, "role"> | null; error: unknown };
  return data?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const today = getTodayIST();
  const dow = getDayOfWeek(today);

  const [usersRes, choresRes, completionsRes] = await Promise.all([
    admin.from("profiles").select("id, name").eq("role", "user"),
    admin.from("chores").select("*").eq("is_active", true),
    admin.from("chore_completions").select("user_id, chore_id").eq("completed_date", today),
  ]);

  const users = (usersRes.data as Pick<Profile, "id" | "name">[]) ?? [];
  const todaysChores = getChoresForDay((choresRes.data as Chore[]) ?? [], dow);
  const completions = (completionsRes.data as Pick<ChoreCompletion, "user_id" | "chore_id">[]) ?? [];

  const behind = users
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
