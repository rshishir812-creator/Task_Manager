import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ChoreManager from "@/components/admin/ChoreManager";
import { getParentContext, getChildrenOfFamily } from "@/lib/auth-scope";
import { getFamilyPlan } from "@/lib/subscription";
import type { Chore, ChoreAssignment } from "@/lib/types";

export default async function AdminChoresPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const plan = await getFamilyPlan(ctx.familyId);
  const adminClient = createAdminClient();

  const [{ data: choresData }, kids] = await Promise.all([
    adminClient.from("chores").select("*").eq("family_id", ctx.familyId).order("sort_order"),
    getChildrenOfFamily(ctx.familyId),
  ]);

  const chores = (choresData as Chore[] | null) ?? [];
  const choreIds = chores.map((c) => c.id);

  let assignments: ChoreAssignment[] = [];
  if (choreIds.length > 0) {
    const { data: assignmentsData } = await adminClient
      .from("chore_assignments")
      .select("*")
      .in("chore_id", choreIds);
    assignments = (assignmentsData as ChoreAssignment[] | null) ?? [];
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Chore Management ⚔️</h1>
        <p className="text-sm text-fg-muted mt-1">{chores.length} chores · drag to reorder</p>
      </div>
      <ChoreManager initialChores={chores} kids={kids} initialAssignments={assignments} plan={plan} isSuperAdmin={ctx.isSuperAdmin} />
    </div>
  );
}
