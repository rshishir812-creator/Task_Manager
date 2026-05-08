import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChoreManager from "@/components/admin/ChoreManager";
import type { Chore, Profile } from "@/lib/types";

export default async function AdminChoresPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await createAdminClient()
    .from("profiles").select("role").eq("id", user.id).single() as { data: Pick<Profile, "role"> | null; error: unknown };
  if (profileData?.role !== "admin") redirect("/dashboard");

  const { data: choresData } = await createAdminClient()
    .from("chores").select("*").order("sort_order");

  const chores = (choresData as Chore[] | null) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Chore Management ⚔️</h1>
        <p className="text-sm text-fg-muted mt-1">{chores.length} chores · drag to reorder</p>
      </div>
      <ChoreManager initialChores={chores} />
    </div>
  );
}
