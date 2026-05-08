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

/** Toggle a completion for a given user/chore/date */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, choreId, date, action } = await request.json() as {
    userId: string;
    choreId: string;
    date: string;
    action: "complete" | "uncomplete" | "exception";
    exceptionReason?: string;
  };

  const adminClient = createAdminClient();

  if (action === "uncomplete") {
    await adminClient
      .from("chore_completions")
      .delete()
      .eq("user_id", userId)
      .eq("chore_id", choreId)
      .eq("completed_date", date);
    return NextResponse.json({ ok: true });
  }

  const { data: chore } = await adminClient
    .from("chores").select("points").eq("id", choreId).single() as { data: { points: number } | null; error: unknown };

  const isException = action === "exception";
  await adminClient.from("chore_completions").upsert(
    {
      chore_id: choreId,
      user_id: userId,
      completed_date: date,
      is_exception: isException,
      exception_reason: null,
      completed_at: new Date().toISOString(),
      points_earned: isException ? 0 : (chore?.points ?? 0),
    },
    { onConflict: "chore_id,user_id,completed_date" }
  );

  return NextResponse.json({ ok: true });
}
