import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { choreId, completedDate } = await request.json() as {
    choreId: string;
    completedDate: string;
  };

  const adminClient = createAdminClient();

  await adminClient
    .from("chore_completions")
    .delete()
    .eq("chore_id", choreId)
    .eq("user_id", user.id)
    .eq("completed_date", completedDate);

  // Remove daily bonus if any chore is now uncompleted
  await adminClient
    .from("daily_bonuses")
    .delete()
    .eq("user_id", user.id)
    .eq("bonus_date", completedDate);

  return NextResponse.json({ success: true });
}
