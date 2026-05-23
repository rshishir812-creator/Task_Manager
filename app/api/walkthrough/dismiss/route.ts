import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ walkthrough_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
