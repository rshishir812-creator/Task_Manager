import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";

export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids } = await request.json() as { ids: string[] };
  const adminClient = createAdminClient();

  // Verify all ids belong to this family before reordering
  const { data: rows } = await adminClient
    .from("chores")
    .select("id, family_id")
    .in("id", ids);
  const all = (rows as { id: string; family_id: string }[] | null) ?? [];
  const allInFamily = all.length === ids.length && all.every((r) => r.family_id === ctx.familyId);
  if (!allInFamily && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Promise.all(
    ids.map((id, index) =>
      adminClient.from("chores").update({ sort_order: index }).eq("id", id)
    )
  );

  return NextResponse.json({ ok: true });
}
