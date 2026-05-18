import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, isChildOfFamily } from "@/lib/auth-scope";

async function authorize(userId: string, badgeId: string, ctx: { familyId: string; isSuperAdmin: boolean }) {
  if (ctx.isSuperAdmin) return true;
  const adminClient = createAdminClient();
  const [childOk, { data: badge }] = await Promise.all([
    isChildOfFamily(userId, ctx.familyId),
    adminClient.from("badges").select("family_id").eq("id", badgeId).single(),
  ]);
  if (!childOk) return false;
  if (!badge || (badge as { family_id: string }).family_id !== ctx.familyId) return false;
  return true;
}

export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, badgeId } = await request.json() as { userId: string; badgeId: string };

  if (!(await authorize(userId, badgeId, ctx))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Already earned" }, { status: 409 });

  const { data, error } = await adminClient
    .from("user_badges")
    .insert({ user_id: userId, badge_id: badgeId, earned_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ userBadge: data });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, badgeId } = await request.json() as { userId: string; badgeId: string };

  if (!(await authorize(userId, badgeId, ctx))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await createAdminClient()
    .from("user_badges")
    .delete()
    .eq("user_id", userId)
    .eq("badge_id", badgeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
