import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext, getChildrenOfFamily, isChildOfFamily } from "@/lib/auth-scope";
import type { Chore, DayOfWeek } from "@/lib/types";

interface PresetChoreInput {
  title: string;
  icon: string;
  points: number;
  recurrence: DayOfWeek[];
}

const STREAK_THRESHOLDS = [
  { days: 3,   icon: "🥉", label: "3-Day"   },
  { days: 7,   icon: "🥈", label: "7-Day"   },
  { days: 10,  icon: "🥇", label: "10-Day"  },
  { days: 15,  icon: "🔥", label: "15-Day"  },
  { days: 30,  icon: "💎", label: "30-Day"  },
  { days: 50,  icon: "👑", label: "50-Day"  },
  { days: 100, icon: "🌟", label: "100-Day" },
];

export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent") {
    return NextResponse.json({ error: "Only parents can onboard" }, { status: 403 });
  }

  const { chores, targetChildId } = await request.json() as {
    chores: PresetChoreInput[];
    targetChildId?: string;
  };
  if (!Array.isArray(chores) || chores.length === 0) {
    return NextResponse.json({ error: "Provide at least one chore" }, { status: 400 });
  }
  if (chores.length > 30) {
    return NextResponse.json({ error: "Max 30 chores at a time" }, { status: 400 });
  }

  // Resolve the target child(ren) for the new chores
  let targetIds: string[];
  if (targetChildId) {
    const isChild = await isChildOfFamily(targetChildId, ctx.familyId);
    if (!isChild) return NextResponse.json({ error: "Invalid child" }, { status: 400 });
    targetIds = [targetChildId];
  } else {
    const allChildren = await getChildrenOfFamily(ctx.familyId);
    if (allChildren.length === 0) {
      return NextResponse.json({ error: "Invite a child first" }, { status: 400 });
    }
    targetIds = allChildren.map((c) => c.id);
  }

  const adminClient = createAdminClient();

  // Bulk insert chores, scoped to this family
  const choreRows = chores.map((c, idx) => ({
    title: c.title.trim(),
    description: null,
    icon: c.icon,
    points: c.points,
    recurrence: c.recurrence,
    is_active: true,
    sort_order: idx,
    created_by: ctx.user.id,
    family_id: ctx.familyId,
  }));

  const { data: created, error } = await adminClient
    .from("chores")
    .insert(choreRows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const createdChores = (created as Chore[] | null) ?? [];

  // Bulk-generate the standard 7-tier streak ladder for every new chore
  const badgeRows = createdChores.flatMap((chore) => {
    const slug = chore.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return STREAK_THRESHOLDS.map(({ days, icon, label }) => ({
      code: `chore_streak_${days}_${slug}`,
      title: `${label} ${chore.title} Streak`,
      description: `Complete ${chore.title} for ${days} days in a row`,
      icon,
      chore_id: chore.id,
      threshold: days,
      badge_type: "streak" as const,
      family_id: ctx.familyId,
    }));
  });

  if (badgeRows.length > 0) {
    // Skip silently on duplicates (re-onboarding scenarios) — composite (code, family_id) is unique
    await adminClient.from("badges").upsert(badgeRows, { onConflict: "code,family_id" });
  }

  // Assign every new chore to every target child
  const assignmentRows = createdChores.flatMap((chore) =>
    targetIds.map((user_id) => ({ chore_id: chore.id, user_id })),
  );
  if (assignmentRows.length > 0) {
    await adminClient.from("chore_assignments").insert(assignmentRows);
  }

  return NextResponse.json({ created: createdChores.length });
}
