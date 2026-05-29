import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const intent = searchParams.get("intent"); // "parent" | "child" | null
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description") ?? "";

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || "Authentication failed")}`
    );
  }

  if (code) {
    const supabase = createClient();
    const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeErr) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeErr.message || "Sign-in failed")}`
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Use the admin client so RLS doesn't bite during this initial lookup
      // (the profile row was just created by the handle_new_user trigger).
      const { data: profile } = await createAdminClient()
        .from("profiles")
        .select("id, role, family_id, is_super_admin, privacy_consent_given_at")
        .eq("id", user.id)
        .single() as { data: Pick<Profile, "id" | "role" | "family_id" | "is_super_admin" | "privacy_consent_given_at"> | null; error: unknown };

      if (!profile) {
        return NextResponse.redirect(`${origin}/login`);
      }

      // Children always go to their dashboard
      if (profile.role === "child") {
        return NextResponse.redirect(`${origin}/dashboard`);
      }

      // Safeguard: someone tapped "I'm a Kid" but came out a parent. The
      // handle_new_user trigger auto-creates a parent + family for any
      // non-invited Google sign-in, so an un-invited kid would otherwise be
      // stranded as a stray parent (and could never be invited later, because
      // the trigger only fires for brand-new users). If — and only if — this
      // is a brand-new empty parent family with no invitation on record, undo
      // it cleanly and ask them to get invited first.
      if (intent === "child" && profile.role === "parent") {
        const admin = createAdminClient();
        const [{ count: choreCount }, { count: memberCount }, { count: inviteCount }] =
          await Promise.all([
            admin.from("chores").select("id", { count: "exact", head: true }).eq("family_id", profile.family_id),
            admin.from("profiles").select("id", { count: "exact", head: true }).eq("family_id", profile.family_id),
            admin.from("child_invitations").select("id", { count: "exact", head: true }).ilike("email", user.email ?? ""),
          ]);

        const isBrandNewEmptyFamily =
          (choreCount ?? 0) === 0 && (memberCount ?? 1) === 1 && (inviteCount ?? 0) === 0;

        if (isBrandNewEmptyFamily) {
          // Order matters: the profile→auth.users FK has no cascade, and the
          // profile→family FK blocks deleting the family while the profile exists.
          await admin.from("profiles").delete().eq("id", user.id);
          await admin.from("families").delete().eq("id", profile.family_id);
          await admin.auth.admin.deleteUser(user.id);
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(
              "No invitation yet — ask a parent to add your email, then sign in again."
            )}`
          );
        }
        // Otherwise it's an established parent who tapped the wrong button —
        // fall through and route them normally.
      }

      // Parents must accept the privacy policy before doing anything else
      if (!profile.privacy_consent_given_at) {
        return NextResponse.redirect(`${origin}/admin/privacy-consent`);
      }

      // Parent (and super-admin parent) routing priority:
      //   no chores         → /admin/onboarding (the moat)
      //   no children       → /admin/family
      //   everything set up → /admin/dashboard
      const admin = createAdminClient();
      const [choreCountRes, childCountRes] = await Promise.all([
        admin
          .from("chores")
          .select("id", { count: "exact", head: true })
          .eq("family_id", profile.family_id),
        admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("family_id", profile.family_id)
          .eq("role", "child"),
      ]);

      // Children must exist before the wizard can run (wizard targets a specific child)
      let target = "/admin/dashboard";
      if ((childCountRes.count ?? 0) === 0) target = "/admin/family";
      else if ((choreCountRes.count ?? 0) === 0) target = "/admin/onboarding";
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
