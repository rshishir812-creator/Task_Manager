import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";
import VerificationsPanel from "@/components/admin/VerificationsPanel";
import type { Chore, ChoreCompletion, Profile } from "@/lib/types";

export default async function AdminVerificationsPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const admin = createAdminClient();

  // Pull all chores in family + all kids (small lists, denormalize on the client)
  const [{ data: kidsData }, { data: choresData }] = await Promise.all([
    admin.from("profiles").select("*").eq("family_id", ctx.familyId).eq("role", "child"),
    admin.from("chores").select("*").eq("family_id", ctx.familyId),
  ]);
  const kids = (kidsData as Profile[] | null) ?? [];
  const chores = (choresData as Chore[] | null) ?? [];

  // All completions in this family (pending first, then recent decided)
  const kidIds = kids.map((k) => k.id);
  let completions: ChoreCompletion[] = [];
  if (kidIds.length > 0) {
    const { data } = await admin
      .from("chore_completions")
      .select("*")
      .in("user_id", kidIds)
      .order("completed_at", { ascending: false })
      .limit(200);
    completions = (data as ChoreCompletion[] | null) ?? [];
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Verifications 🔍</h1>
        <p className="text-sm text-fg-muted mt-1">
          Approve or deny chore completions that require your sign-off.
        </p>
      </div>
      <VerificationsPanel
        initialCompletions={completions}
        kids={kids}
        chores={chores}
      />
    </div>
  );
}
