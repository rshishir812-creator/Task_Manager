import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";

/** PATCH /api/parent/family  { name } — rename the parent's own family */
export async function PATCH(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent") {
    return NextResponse.json({ error: "Only parents can rename a family" }, { status: 403 });
  }

  const { name } = await request.json() as { name: string };
  const cleaned = (name ?? "").trim();
  if (!cleaned) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (cleaned.length > 60) return NextResponse.json({ error: "Name too long" }, { status: 400 });

  const { data, error } = await createAdminClient()
    .from("families")
    .update({ name: cleaned })
    .eq("id", ctx.familyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ family: data });
}
