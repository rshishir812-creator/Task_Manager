import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import HeatmapCalendar from "@/components/chores/HeatmapCalendar";
import { getTodayIST } from "@/lib/streak-calculator";
import type { Chore, ChoreCompletion } from "@/lib/types";

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const [{ data: choresData }, { data: completionsData }] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", user.id),
  ]);

  const chores = (choresData as Chore[] | null) ?? [];
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
