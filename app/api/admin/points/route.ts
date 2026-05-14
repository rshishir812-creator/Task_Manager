import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayIST } from "@/lib/streak-calculator";
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

  const today = getTodayIST();

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
