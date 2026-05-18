import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ChoreManager from "@/components/admin/ChoreManager";
import { getParentContext } from "@/lib/auth-scope";
import type { Chore } from "@/lib/types";

export default async function AdminChoresPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const { data: choresData } = await createAdminClient()
    .from("chores")
    .select("*")
    .eq("family_id", ctx.familyId)
    .order("sort_order");

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
