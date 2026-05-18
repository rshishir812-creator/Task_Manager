import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";
import type { Chore } from "@/lib/types";

export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as Omit<Chore, "id" | "created_at" | "family_id">;

  const { data, error } = await createAdminClient()
    .from("chores")
    .insert({ ...body, created_by: ctx.user.id, family_id: ctx.familyId })
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
    family_id: ctx.familyId,
  }));
  await createAdminClient().from("badges").insert(badges).select();

  return NextResponse.json({ chore });
}
