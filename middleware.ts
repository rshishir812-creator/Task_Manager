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

  // Helper: fetch role from profiles
  async function getRole() {
    if (!user) return null;
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
      .select("role")
      .eq("id", user.id)
      .single() as { data: Pick<Profile, "role"> | null; error: unknown };
    return data?.role ?? null;
  }

  // Login page: redirect signed-in users to their dashboard
  if (pathname === "/login") {
    if (user) {
      const role = await getRole();
      const target = role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  // Admin routes: require auth + admin role
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = await getRole();
    if (role !== "admin") {
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

  // Root: redirect based on auth state
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = await getRole();
    const target = role === "admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
