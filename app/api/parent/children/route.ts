import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";
import { getFamilyPlan, FREE_LIMITS, upgradeRequiredResponse } from "@/lib/subscription";
import type { ChildInvitation, Profile } from "@/lib/types";

/**
 * GET /api/parent/children
 *   → { children: Profile[]; invitations: ChildInvitation[] }
 *
 * POST /api/parent/children   { name, email }
 *   → creates a pending child_invitation; child joins on next Google login.
 *
 * DELETE /api/parent/children?invitationId=<uuid>
 *   → revokes a pending invitation.
 */

export async function GET() {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const [children, invitations] = await Promise.all([
    admin.from("profiles").select("*").eq("family_id", ctx.familyId).eq("role", "child").order("created_at"),
    admin.from("child_invitations").select("*").eq("family_id", ctx.familyId).is("accepted_at", null).order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    children: (children.data as Profile[] | null) ?? [],
    invitations: (invitations.data as ChildInvitation[] | null) ?? [],
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent") {
    return NextResponse.json({ error: "Only parents can invite children" }, { status: 403 });
  }

  const { email, name } = await request.json() as { email: string; name?: string };
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Free-tier limit: max children (existing + pending child invitations).
  // Premium / active trial = unlimited.
  const plan = await getFamilyPlan(ctx.familyId);
  if (!plan.hasPremiumAccess && !ctx.isSuperAdmin) {
    const [{ count: childCount }, { count: pendingCount }] = await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("family_id", ctx.familyId)
        .eq("role", "child"),
      admin
        .from("child_invitations")
        .select("id", { count: "exact", head: true })
        .eq("family_id", ctx.familyId)
        .is("accepted_at", null)
        .neq("role", "parent"),
    ]);
    if ((childCount ?? 0) + (pendingCount ?? 0) >= FREE_LIMITS.maxChildren) {
      return upgradeRequiredResponse(
        `The Free plan supports ${FREE_LIMITS.maxChildren} child. Upgrade to add more of your family.`,
      );
    }
  }

  // Already a member?
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

  // Already invited?
  const { data: existingInvite } = await admin
    .from("child_invitations")
    .select("id, family_id")
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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invitation: data, suggestedName: name ?? null });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const invitationId = url.searchParams.get("invitationId");
  if (!invitationId) {
    return NextResponse.json({ error: "invitationId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  // Verify the invitation belongs to this family
  const { data: invite } = await admin
    .from("child_invitations")
    .select("family_id, accepted_at")
    .eq("id", invitationId)
    .single();
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((invite as { family_id: string; accepted_at: string | null }).family_id !== ctx.familyId && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .from("child_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
