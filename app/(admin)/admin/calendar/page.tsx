import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import AdminCalendar from "@/components/admin/AdminCalendar";
import { getTodayIST } from "@/lib/streak-calculator";
import { getParentContext, resolveChild, getChildrenOfFamily, getAssignmentsForUser } from "@/lib/auth-scope";
import ChildPicker from "@/components/admin/ChildPicker";
import Link from "next/link";
import type { Chore, ChoreCompletion } from "@/lib/types";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const adminClient = createAdminClient();
  const [child, allChildren] = await Promise.all([
    resolveChild(ctx.familyId, searchParams, ctx.isSuperAdmin),
    getChildrenOfFamily(ctx.familyId),
  ]);

  if (!child) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-fg">Calendar View 📅</h1>
        <p className="text-sm text-fg-muted">No children added yet.</p>
        <Link href="/admin/family" className="text-sm text-accent-amber">Add a child →</Link>
      </div>
    );
  }

  const ridham = child;

  const [{ data: choresData }, { data: completionsData }, assignments] = await Promise.all([
    // Include inactive chores so soft-deleted ones still render their past dots
    adminClient.from("chores").select("*").eq("family_id", ctx.familyId).order("sort_order"),
    adminClient.from("chore_completions").select("*").eq("user_id", ridham.id),
    getAssignmentsForUser(ridham.id),
  ]);

  const chores = (choresData as Chore[] | null) ?? [];
  const completions = (completionsData as ChoreCompletion[] | null) ?? [];
  const today = getTodayIST();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Calendar View 📅</h1>
        <p className="text-sm text-fg-muted mt-1">
          Retroactively edit {ridham.name?.split(" ")[0] ?? "child"}&apos;s completions
        </p>
      </div>
      <ChildPicker kids={allChildren} currentChildId={ridham.id} />
      <AdminCalendar
        chores={chores}
        completions={completions}
        assignments={assignments}
        userId={ridham.id}
        today={today}
      />
    </div>
  );
}
