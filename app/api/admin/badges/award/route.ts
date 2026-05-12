import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await createAdminClient()
    .from("profiles").select("role").eq("id", user.id).single() as { data: Pick<Profile, "role"> | null; error: unknown };
  return data?.role === "admin";
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, badgeId } = await request.json() as { userId: string; badgeId: string };
  const adminClient = createAdminClient();

  // Check not already earned
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
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, badgeId } = await request.json() as { userId: string; badgeId: string };
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("user_badges")
    .delete()
    .eq("user_id", userId)
    .eq("badge_id", badgeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
