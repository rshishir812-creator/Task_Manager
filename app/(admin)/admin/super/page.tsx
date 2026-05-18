import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminContext } from "@/lib/auth-scope";
import Link from "next/link";
import type { Family, Profile } from "@/lib/types";

export default async function SuperAdminPage() {
  const ctx = await getSuperAdminContext();
  if (!ctx) redirect("/admin/dashboard");

  const admin = createAdminClient();
  const [familiesRes, profilesRes, choresRes, badgesRes, completionsRes] = await Promise.all([
    admin.from("families").select("*").order("created_at"),
    admin.from("profiles").select("id, name, email, role, family_id, is_super_admin, created_at"),
    admin.from("chores").select("id, family_id"),
    admin.from("badges").select("id, family_id"),
    admin
      .from("chore_completions")
      .select("user_id, completed_at")
      .order("completed_at", { ascending: false })
      .limit(2000),
  ]);

  const families = (familiesRes.data as Family[] | null) ?? [];
  const profiles = (profilesRes.data as Pick<Profile, "id" | "name" | "email" | "role" | "family_id" | "is_super_admin" | "created_at">[] | null) ?? [];
  const chores = (choresRes.data as { id: string; family_id: string }[] | null) ?? [];
  const badges = (badgesRes.data as { id: string; family_id: string }[] | null) ?? [];
  const completions = (completionsRes.data as { user_id: string; completed_at: string | null }[] | null) ?? [];

  const profilesByFamily = new Map<string, typeof profiles>();
  for (const p of profiles) {
    if (!profilesByFamily.has(p.family_id)) profilesByFamily.set(p.family_id, []);
    profilesByFamily.get(p.family_id)!.push(p);
  }
  const profileFamilyById = new Map(profiles.map((p) => [p.id, p.family_id]));

  const lastCompletionByFamily = new Map<string, string>();
  for (const c of completions) {
    if (!c.completed_at) continue;
    const fid = profileFamilyById.get(c.user_id);
    if (!fid) continue;
    if (!lastCompletionByFamily.has(fid)) lastCompletionByFamily.set(fid, c.completed_at);
  }

  const rows = families.map((f) => {
    const fProfiles = profilesByFamily.get(f.id) ?? [];
    const parents = fProfiles.filter((p) => p.role === "parent").length;
    const children = fProfiles.filter((p) => p.role === "child").length;
    const choreCount = chores.filter((c) => c.family_id === f.id).length;
    const badgeCount = badges.filter((b) => b.family_id === f.id).length;
    const lastActivity = lastCompletionByFamily.get(f.id) ?? null;
    return { family: f, parents, children, choreCount, badgeCount, lastActivity };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">🛡️ Super Admin</h1>
        <p className="text-sm text-fg-muted mt-1">
          {families.length} {families.length === 1 ? "family" : "families"} · {profiles.length} profiles
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-xs text-fg-muted uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Family</th>
              <th className="text-left px-4 py-3">Parents</th>
              <th className="text-left px-4 py-3">Children</th>
              <th className="text-left px-4 py-3">Chores</th>
              <th className="text-left px-4 py-3">Badges</th>
              <th className="text-left px-4 py-3">Last activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((r) => (
              <tr key={r.family.id} className="hover:bg-bg/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/super/${r.family.id}`} className="text-fg font-semibold hover:text-accent-teal">
                    {r.family.name}
                  </Link>
                  <p className="text-xs text-fg-muted">
                    Created {new Date(r.family.created_at).toLocaleDateString("en-IN")}
                  </p>
                </td>
                <td className="px-4 py-3 text-fg">{r.parents}</td>
                <td className="px-4 py-3 text-fg">{r.children}</td>
                <td className="px-4 py-3 text-fg">{r.choreCount}</td>
                <td className="px-4 py-3 text-fg">{r.badgeCount}</td>
                <td className="px-4 py-3 text-xs text-fg-muted">
                  {r.lastActivity
                    ? new Date(r.lastActivity).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-fg-muted">
        Tip: click into a family to see its members and impersonate a child via the existing view-as flow.
      </div>
    </div>
  );
}
