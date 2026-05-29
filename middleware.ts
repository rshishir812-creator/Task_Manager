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

  // Helper: fetch role + super-admin flag from profiles
  async function getRoleAndSuper(): Promise<{ role: "parent" | "child" | null; isSuperAdmin: boolean }> {
    if (!user) return { role: null, isSuperAdmin: false };
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
    const { data } = await supabase
      .from("profiles")
      .select("role, is_super_admin")
      .eq("id", user.id)
      .single() as { data: Pick<Profile, "role" | "is_super_admin"> | null; error: unknown };
    return {
      role: data?.role ?? null,
      isSuperAdmin: data?.is_super_admin ?? false,
    };
  }

  // Login page: redirect signed-in users to their dashboard
  if (pathname === "/login") {
    if (user) {
      const { role, isSuperAdmin } = await getRoleAndSuper();
      const target = role === "parent" || isSuperAdmin ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  // Admin routes: parents and super admins
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { role, isSuperAdmin } = await getRoleAndSuper();
    if (role !== "parent" && !isSuperAdmin) {
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

  // Root: redirect based on auth state
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { role, isSuperAdmin } = await getRoleAndSuper();
    const target = role === "parent" || isSuperAdmin ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
