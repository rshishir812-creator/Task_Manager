import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getParentContext, resolveChild, getChildrenOfFamily } from "@/lib/auth-scope";
import ChildPicker from "@/components/admin/ChildPicker";
import HolidayManager from "@/components/admin/HolidayManager";
import Link from "next/link";
import type { Holiday } from "@/lib/types";

export default async function AdminHolidaysPage({
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
        <h1 className="font-display font-bold text-2xl text-fg">Holidays 🏖️</h1>
        <p className="text-sm text-fg-muted">No children added yet.</p>
        <Link href="/admin/family" className="text-sm text-accent-amber">Add a child →</Link>
      </div>
    );
  }

  const { data: holidaysData } = await adminClient
    .from("holidays")
    .select("*")
    .eq("user_id", child.id)
    .order("start_date", { ascending: false });
  const holidays = (holidaysData as Holiday[] | null) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Holidays 🏖️</h1>
        <p className="text-sm text-fg-muted mt-1">
          Mark illness or travel days. Those dates are exempt — no chores due, and
          streaks, badges &amp; progress are never affected. Backdated ranges are fine.
        </p>
      </div>
      <ChildPicker kids={allChildren} currentChildId={child.id} />
      <HolidayManager
        userId={child.id}
        childName={child.name?.split(" ")[0] ?? "child"}
        hasSiblings={allChildren.length > 1}
        initialHolidays={holidays}
      />
    </div>
  );
}
