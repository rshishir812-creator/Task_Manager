import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, getChildrenOfFamily } from "@/lib/auth-scope";
import type { Holiday, HolidayReason } from "@/lib/types";

interface CreateHolidayBody {
  userId?: string;        // target child; ignored when applyToAll
  applyToAll?: boolean;   // create one row per child in the family
  startDate?: string;     // YYYY-MM-DD
  endDate?: string;       // YYYY-MM-DD
  reason?: HolidayReason;
  note?: string;
}

const VALID_REASONS: HolidayReason[] = ["illness", "travel", "other"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent" && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as CreateHolidayBody;
  const startDate = body.startDate?.trim();
  const endDate = body.endDate?.trim();
  const reason: HolidayReason = VALID_REASONS.includes(body.reason as HolidayReason)
    ? (body.reason as HolidayReason)
    : "other";
  const note = body.note?.trim() || null;

  if (!startDate || !endDate || !DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return NextResponse.json({ error: "Valid start and end dates are required." }, { status: 400 });
  }
  if (startDate > endDate) {
    return NextResponse.json({ error: "Start date must be on or before the end date." }, { status: 400 });
  }

  const admin = createAdminClient();
  const allChildren = await getChildrenOfFamily(ctx.familyId);
  const childIds = new Set(allChildren.map((c) => c.id));

  // Determine target child(ren)
  let targetIds: string[];
  if (body.applyToAll) {
    targetIds = allChildren.map((c) => c.id);
  } else {
    if (!body.userId || !childIds.has(body.userId)) {
      return NextResponse.json({ error: "Pick a child in your family." }, { status: 400 });
    }
    targetIds = [body.userId];
  }
  if (targetIds.length === 0) {
    return NextResponse.json({ error: "No children to apply to." }, { status: 400 });
  }

  const rows = targetIds.map((uid) => ({
    family_id: ctx.familyId,
    user_id: uid,
    start_date: startDate,
    end_date: endDate,
    reason,
    note,
    created_by: ctx.user.id,
  }));

  const { data, error } = await admin.from("holidays").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ holidays: data as Holiday[] });
}
