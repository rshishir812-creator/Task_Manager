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

  // Copy any auth cookies that updateSession refreshed onto a redirect we build
  // ourselves. Supabase refresh tokens are single-use/rotating: updateSession
  // may have just consumed the old one and written the new one onto `response`.
  // A bare NextResponse.redirect() does NOT carry those Set-Cookie headers, so
  // returning one would discard the rotated token — the browser keeps a dead
  // token and the session dies on the next request. Because the PWA's start_url
  // is "/", every cold launch hits a redirect here, which is why sessions kept
  // dropping and users had to sign in again and again.
  const redirectWithSession = (target: string) => {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

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
      return redirectWithSession(target);
    }
    return response;
  }

  // Admin routes: parents and super admins
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return redirectWithSession("/login");
    }
    const { role, isSuperAdmin, failed } = await getRoleAndSuper();
    // If the role read failed, let the request through; the admin layout
    // re-checks with the service-role client and redirects a real child.
    if (!failed && role !== "parent" && !isSuperAdmin) {
      return redirectWithSession("/dashboard");
    }
    return response;
  }

  // User dashboard routes: require auth
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return redirectWithSession("/login");
    }
    return response;
  }

  // Profile/account page: any authenticated user (parent or child)
  if (pathname.startsWith("/profile")) {
    if (!user) {
      return redirectWithSession("/login");
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
      return redirectWithSession(target);
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
