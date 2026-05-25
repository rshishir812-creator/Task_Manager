import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";
import { getFamilyPlan, upgradeRequiredResponse } from "@/lib/subscription";

/**
 * POST /api/parent/coparent  { email }
 * Creates a pending invitation in child_invitations with role='parent'.
 * The handle_new_user trigger picks up the role on the invitee's first sign-in.
 */
export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent") {
    return NextResponse.json({ error: "Only parents can invite a co-parent" }, { status: 403 });
  }

  // Co-parents are a Premium feature.
  const plan = await getFamilyPlan(ctx.familyId);
  if (!plan.hasPremiumAccess) {
    return upgradeRequiredResponse("Adding a co-parent is a Premium feature. Upgrade to invite another adult.");
  }

  const { email } = await request.json() as { email: string };
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, family_id, role")
    .ilike("email", cleanEmail)
    .maybeSingle();
  if (existingProfile) {
    return NextResponse.json(
      { error: "That email is already registered. Ask them to sign in instead." },
      { status: 409 },
    );
  }

  const { data: existingInvite } = await admin
    .from("child_invitations")
    .select("id")
    .ilike("email", cleanEmail)
    .is("accepted_at", null)
    .maybeSingle();
  if (existingInvite) {
    return NextResponse.json(
      { error: "There's already a pending invitation for that email." },
      { status: 409 },
    );
  }

  const { data, error } = await admin
    .from("child_invitations")
    .insert({
      family_id: ctx.familyId,
      email: cleanEmail,
      invited_by: ctx.user.id,
      role: "parent",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invitation: data });
}
