import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";

/**
 * DELETE /api/parent/children/:id
 *
 * Removes a child profile from the family. Cascades the FK on
 * chore_completions / streaks / daily_bonuses / user_badges so the kid's
 * history is wiped along with the profile. The child's auth.users row is
 * NOT touched — that's a Supabase admin operation.
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent" && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Verify target is a child in the parent's family (super admin can cross families)
  const { data: target } = await admin
    .from("profiles")
    .select("id, family_id, role")
    .eq("id", params.id)
    .single();
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const t = target as { id: string; family_id: string; role: string };
  if (t.role !== "child") {
    return NextResponse.json({ error: "Can only remove children" }, { status: 400 });
  }
  if (t.family_id !== ctx.familyId && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("profiles").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
