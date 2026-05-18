import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, isChildOfFamily } from "@/lib/auth-scope";

/** Toggle a completion for a given user/chore/date */
export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, choreId, date, action } = await request.json() as {
    userId: string;
    choreId: string;
    date: string;
    action: "complete" | "uncomplete" | "exception";
    exceptionReason?: string;
  };

  // Verify the target child belongs to this parent's family (or super admin)
  if (!ctx.isSuperAdmin) {
    const ok = await isChildOfFamily(userId, ctx.familyId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
