import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import HeatmapCalendar from "@/components/chores/HeatmapCalendar";
import { getTodayIST } from "@/lib/streak-calculator";
import { getAssignedChoreIds } from "@/lib/auth-scope";
import type { Chore, ChoreCompletion, Profile } from "@/lib/types";

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const { data: profileData } = await adminClient
    .from("profiles").select("family_id").eq("id", user.id).single();
  const profile = profileData as Pick<Profile, "family_id"> | null;
  if (!profile) redirect("/login");

  const [{ data: choresData }, { data: completionsData }, assignedIds] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).eq("family_id", profile.family_id).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", user.id),
    getAssignedChoreIds(user.id),
  ]);

  const allChores = (choresData as Chore[] | null) ?? [];
  const chores = allChores.filter((c) => assignedIds.has(c.id));
  const completions = (completionsData as ChoreCompletion[] | null) ?? [];
  const today = getTodayIST();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display font-bold text-2xl text-fg">History 📅</h1>
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-4">
        <HeatmapCalendar chores={chores} completions={completions} today={today} />
      </div>
    </div>
  );
}
