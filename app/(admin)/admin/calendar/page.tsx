import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminCalendar from "@/components/admin/AdminCalendar";
import { getTodayIST } from "@/lib/streak-calculator";
import type { Chore, ChoreCompletion, Profile } from "@/lib/types";

export default async function AdminCalendarPage() {
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
        <h1 className="font-display font-bold text-2xl text-fg">Calendar View 📅</h1>
        <p className="text-sm text-fg-muted">No user account found yet.</p>
      </div>
    );
  }

  const [{ data: choresData }, { data: completionsData }] = await Promise.all([
    adminClient.from("chores").select("*").eq("is_active", true).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", ridham.id),
  ]);

  const chores = (choresData as Chore[] | null) ?? [];
  const completions = (completionsData as ChoreCompletion[] | null) ?? [];
  const today = getTodayIST();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Calendar View 📅</h1>
        <p className="text-sm text-fg-muted mt-1">
          Retroactively edit {ridham.name?.split(" ")[0] ?? "Ridham"}&apos;s completions
        </p>
      </div>
      <AdminCalendar
        chores={chores}
        completions={completions}
        userId={ridham.id}
        today={today}
      />
    </div>
  );
}
