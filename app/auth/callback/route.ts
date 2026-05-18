import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
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
        .select("id, role, family_id, is_super_admin")
        .eq("id", user.id)
        .single() as { data: Pick<Profile, "id" | "role" | "family_id" | "is_super_admin"> | null; error: unknown };

      if (!profile) {
        return NextResponse.redirect(`${origin}/login`);
      }

      // Children always go to their dashboard
      if (profile.role === "child") {
        return NextResponse.redirect(`${origin}/dashboard`);
      }

      // Parent (and super-admin parent): if their family has no children yet,
      // land them on /admin/family so they invite their first child.
      const { count } = await createAdminClient()
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("family_id", profile.family_id)
        .eq("role", "child");

      const target = (count ?? 0) > 0 ? "/admin/dashboard" : "/admin/family";
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
