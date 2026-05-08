import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description") ?? "";

  if (error) {
    if (errorDescription.toLowerCase().includes("not authorized for chorequest")) {
      return NextResponse.redirect(`${origin}/access-denied`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || "Authentication failed")}`
    );
  }

  if (code) {
    const supabase = createClient();
    const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeErr) {
      // Treat any exchange failure on first login as possible access denial
      return NextResponse.redirect(`${origin}/access-denied`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single() as { data: Pick<Profile, "role"> | null; error: unknown };

      const target = profile?.role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
