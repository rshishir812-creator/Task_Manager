import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WHATS_NEW_VERSION } from "@/lib/whats-new";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ whats_new_seen_version: WHATS_NEW_VERSION })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
