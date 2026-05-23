import { NextResponse } from "next/server";
import { getSuperAdminContext } from "@/lib/auth-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackStatus } from "@/lib/types";

const ALLOWED_STATUSES: FeedbackStatus[] = ["new", "in_progress", "resolved", "archived"];

interface PatchBody {
  status?: unknown;
  admin_note?: unknown;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status =
    typeof body.status === "string" && ALLOWED_STATUSES.includes(body.status as FeedbackStatus)
      ? (body.status as FeedbackStatus)
      : undefined;

  const adminNote =
    typeof body.admin_note === "string"
      ? body.admin_note.trim().slice(0, 4000) || null
      : undefined;

  if (status === undefined && adminNote === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    reviewed_by: ctx.user.id,
    reviewed_at: new Date().toISOString(),
  };
  if (status !== undefined) update.status = status;
  if (adminNote !== undefined) update.admin_note = adminNote;

  const { error } = await createAdminClient()
    .from("feedback")
    .update(update)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
