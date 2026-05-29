import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import SignOutButton from "@/components/ui/SignOutButton";
import SwitchAccountButton from "@/components/ui/SwitchAccountButton";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("name, email, role, avatar_url")
    .eq("id", user.id)
    .single() as { data: Pick<Profile, "name" | "email" | "role" | "avatar_url"> | null; error: unknown };

  if (!profile) redirect("/login");

  const backHref = profile.role === "parent" ? "/admin/dashboard" : "/dashboard";
  const initial = (profile.name ?? profile.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 pt-safe border-b border-[var(--border)] bg-bg-elevated/90 backdrop-blur-sm">
        <Link
          href={backHref}
          aria-label="Back"
          className="flex items-center justify-center rounded-full p-1.5 text-fg-muted transition-colors hover:text-fg hover:bg-bg"
        >
          <ArrowLeft size={20} />
        </Link>
        <span className="font-display text-lg font-bold text-fg">Profile</span>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 flex flex-col items-center text-center">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.name ?? "Avatar"}
            width={88}
            height={88}
            className="rounded-full"
          />
        ) : (
          <div className="flex items-center justify-center w-[88px] h-[88px] rounded-full bg-accent-teal/20 text-accent-teal font-display text-3xl font-bold">
            {initial}
          </div>
        )}

        <h1 className="mt-4 font-display text-2xl font-bold text-fg">
          {profile.name ?? "Your profile"}
        </h1>
        <p className="mt-1 text-sm text-fg-muted break-all">{profile.email}</p>

        <span
          className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            profile.role === "parent"
              ? "bg-accent-amber/20 text-accent-amber"
              : "bg-accent-teal/20 text-accent-teal"
          }`}
        >
          {profile.role === "parent" ? "Parent" : "Kid"}
        </span>

        <div className="mt-10 w-full flex flex-col items-stretch gap-3">
          <p className="text-xs text-fg-muted">
            Sharing this device? Switch to a different account to log in as someone else.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SwitchAccountButton />
            <SignOutButton />
          </div>
        </div>
      </main>
    </div>
  );
}
