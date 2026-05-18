import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";
import type { Chore } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Verify the chore belongs to this parent's family before letting them edit
  const adminClientForCheck = createAdminClient();
  const { data: existingChore } = await adminClientForCheck
    .from("chores")
    .select("family_id")
    .eq("id", params.id)
    .single();
  if (!existingChore) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((existingChore as { family_id: string }).family_id !== ctx.familyId && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as Partial<Chore>;
  // Never allow callers to change family_id via PATCH
  delete (body as { family_id?: string }).family_id;
  const { data, error } = await createAdminClient()
    .from("chores")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If the title changed, update badge titles/descriptions/codes for this chore
  if (body.title) {
    const chore = data as Chore;
    const slug = chore.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const THRESHOLDS = [
      { days: 3,   icon: "🥉", label: "3-Day"   },
      { days: 7,   icon: "🥈", label: "7-Day"   },
      { days: 10,  icon: "🥇", label: "10-Day"  },
      { days: 15,  icon: "🔥", label: "15-Day"  },
      { days: 30,  icon: "💎", label: "30-Day"  },
      { days: 50,  icon: "👑", label: "50-Day"  },
      { days: 100, icon: "🌟", label: "100-Day" },
    ];
    const adminClient = createAdminClient();
    const { data: existingBadges } = await adminClient
      .from("badges")
      .select("id, threshold")
      .eq("chore_id", params.id)
      .eq("badge_type", "streak")
      .like("code", "chore_streak_%");

    if (existingBadges && existingBadges.length > 0) {
      await Promise.all(
        (existingBadges as { id: string; threshold: number | null }[]).map((badge) => {
          const t = THRESHOLDS.find((th) => th.days === badge.threshold);
          if (!t) return Promise.resolve();
          return adminClient
            .from("badges")
            .update({
              code: `chore_streak_${t.days}_${slug}`,
              title: `${t.label} ${chore.title} Streak`,
              description: `Complete ${chore.title} for ${t.days} days in a row`,
            })
            .eq("id", badge.id);
        })
      );
    }
  }

  return NextResponse.json({ chore: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient
    .from("chores")
    .select("family_id")
    .eq("id", params.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((existing as { family_id: string }).family_id !== ctx.familyId && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await adminClient
    .from("chores")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
