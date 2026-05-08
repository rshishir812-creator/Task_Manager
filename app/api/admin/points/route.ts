import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await createAdminClient()
    .from("profiles").select("role").eq("id", user.id).single() as { data: Pick<Profile, "role"> | null; error: unknown };
  if (data?.role !== "admin") return null;
  return user;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, points, reason } = await request.json() as {
    userId: string;
    points: number;
    reason: string;
  };

  if (!reason.trim()) return NextResponse.json({ error: "Reason required" }, { status: 400 });
  if (points === 0) return NextResponse.json({ error: "Points cannot be zero" }, { status: 400 });

  const adminClient = createAdminClient();

  // Store as a synthetic chore_completion with null chore_id won't work with FK.
  // Instead, use daily_bonuses with a large/negative value and today's date + a note stored in metadata.
  // We'll store it as a daily_bonus override with a custom amount.
  // For audit trail: insert into daily_bonuses with a custom points_bonus value.
  // Use a sentinel bonus_date with time component via a UUID-based approach —
  // actual approach: store with today's date but allow multiple rows by not using unique constraint.
  // Simple: just add directly as a bonus entry. The unique constraint on bonus_date needs to be relaxed for overrides.
  // We'll use the daily_bonuses table but insert with a special date format override (ISO timestamp as text workaround).
  // Cleanest: a separate points_overrides table. But we don't have that in schema.
  // Fallback: insert daily_bonus with a unique date string (use ISO date + random suffix won't work since it's date type).
  // REAL solution: use today's date for the bonus and upsert, but admins might want multiple overrides per day.
  // For now: insert into daily_bonuses treating it as an override entry — pick an unused date far in the future for the key
  // and store reason in... well, daily_bonuses has no reason column.
  //
  // SIMPLEST viable: store as a chore_completion with a special synthetic chore that is "Points Override".
  // OR: just store in daily_bonuses with the current timestamp date offset trick.
  //
  // Decision: use a dedicated approach — store in daily_bonuses with an auto-incremented date trick
  // isn't clean. Let's just pick a synthetic date that won't conflict: use null for bonus_date isn't allowed.
  //
  // Best pragmatic solution for Phase 3: Insert with today's date and handle conflict by incrementing points.
  // For negative overrides, we note that total_points sum picks this up.

  const today = new Date().toISOString().slice(0, 10);

  // Check if a manual override row already exists for today (we use points_bonus = large number as signal)
  // Use upsert: if today already has a daily_bonus, we add to it (admin may award multiple times)
  // Since daily_bonuses has unique(bonus_date) per the seed, and user can only get one auto bonus per day,
  // we need a different approach. Insert a new row with a date offset.
  // Use the approach: synthetic date = today + offset based on current count of existing manual bonuses.

  const { data: existing } = await adminClient
    .from("daily_bonuses")
    .select("id, points_bonus")
    .eq("user_id", userId)
    .eq("bonus_date", today);

  const existingCount = existing?.length ?? 0;
  // Use a date far in the future as a unique key for manual overrides:
  // base date 9000-01-01 + offset index
  const overrideDate = `9000-${String(Math.floor(existingCount / 28) + 1).padStart(2, "0")}-${String((existingCount % 28) + 1).padStart(2, "0")}`;

  const { error } = await adminClient.from("daily_bonuses").insert({
    user_id: userId,
    bonus_date: overrideDate,
    points_bonus: points,
    awarded_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, points, reason });
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Return all "override" entries (dates >= 9000)
  const { data } = await createAdminClient()
    .from("daily_bonuses")
    .select("*")
    .eq("user_id", userId)
    .gte("bonus_date", "9000-01-01")
    .order("awarded_at", { ascending: false });

  return NextResponse.json({ overrides: data ?? [] });
}
