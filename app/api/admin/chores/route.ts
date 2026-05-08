import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Chore, Profile } from "@/lib/types";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: Pick<Profile, "role"> | null; error: unknown };
  if (data?.role !== "admin") return null;
  return user;
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as Omit<Chore, "id" | "created_at">;

  const { data, error } = await createAdminClient()
    .from("chores")
    .insert({ ...body, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const chore = data as Chore;

  // Auto-generate the 7 standard streak milestone badges for the new chore
  const THRESHOLDS = [
    { days: 3,   icon: "🥉", label: "3-Day"   },
    { days: 7,   icon: "🥈", label: "7-Day"   },
    { days: 10,  icon: "🥇", label: "10-Day"  },
    { days: 15,  icon: "🔥", label: "15-Day"  },
    { days: 30,  icon: "💎", label: "30-Day"  },
    { days: 50,  icon: "👑", label: "50-Day"  },
    { days: 100, icon: "🌟", label: "100-Day" },
  ];
  const slug = chore.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const badges = THRESHOLDS.map(({ days, icon, label }) => ({
    code: `chore_streak_${days}_${slug}`,
    title: `${label} ${chore.title} Streak`,
    description: `Complete ${chore.title} for ${days} days in a row`,
    icon,
    chore_id: chore.id,
    threshold: days,
    badge_type: "streak" as const,
  }));
  await createAdminClient().from("badges").insert(badges).select();

  return NextResponse.json({ chore });
}
