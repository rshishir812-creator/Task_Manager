import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import type { Profile } from "@/lib/types";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow auth callback and access-denied page
  if (pathname.startsWith("/auth") || pathname.startsWith("/access-denied")) {
    const { response } = await updateSession(request);
    return response;
  }

  const { user, response } = await updateSession(request);

  // Helper: fetch role + super-admin flag from profiles.
  // `failed` distinguishes a transient read error (e.g. right after a token
  // refresh) from a genuine "no profile" row, so callers can avoid silently
  // downgrading an authenticated parent to the child route.
  async function getRoleAndSuper(): Promise<{
    role: "parent" | "child" | null;
    isSuperAdmin: boolean;
    failed: boolean;
  }> {
    if (!user) return { role: null, isSuperAdmin: false, failed: false };
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (n) => request.cookies.get(n)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );
    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_super_admin")
      .eq("id", user.id)
      .single() as { data: Pick<Profile, "role" | "is_super_admin"> | null; error: unknown };
    return {
      role: data?.role ?? null,
      isSuperAdmin: data?.is_super_admin ?? false,
      failed: !!error,
    };
  }

  // Login page: redirect signed-in users to their dashboard
  if (pathname === "/login") {
    if (user) {
      const { role, isSuperAdmin, failed } = await getRoleAndSuper();
      // On a transient read failure, prefer the admin entry; its service-role
      // guard reliably bounces a real child back to /dashboard, so a parent is
      // never silently downgraded.
      const target =
        failed || role === "parent" || isSuperAdmin ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  // Admin routes: parents and super admins
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { role, isSuperAdmin, failed } = await getRoleAndSuper();
    // If the role read failed, let the request through; the admin layout
    // re-checks with the service-role client and redirects a real child.
    if (!failed && role !== "parent" && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // User dashboard routes: require auth
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Profile/account page: any authenticated user (parent or child)
  if (pathname.startsWith("/profile")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Root: signed-in users go to their dashboard; signed-out users see the
  // public marketing homepage (rendered by app/page.tsx).
  if (pathname === "/") {
    if (user) {
      const { role, isSuperAdmin, failed } = await getRoleAndSuper();
      const target =
        failed || role === "parent" || isSuperAdmin ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
