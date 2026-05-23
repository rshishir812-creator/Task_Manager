import { NextResponse } from "next/server";
import { getParentContext } from "@/lib/auth-scope";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const ctx = await getParentContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ privacy_consent_given_at: new Date().toISOString() })
    .eq("id", ctx.user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
