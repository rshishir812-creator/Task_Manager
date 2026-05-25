import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminContext } from "@/lib/auth-scope";
import { computePlan } from "@/lib/subscription";
import SuperFamilyPlan from "@/components/admin/SuperFamilyPlan";
import Link from "next/link";
import type { Family, Profile } from "@/lib/types";

export default async function SuperFamilyPage({ params }: { params: { familyId: string } }) {
  const ctx = await getSuperAdminContext();
  if (!ctx) redirect("/admin/dashboard");

  const admin = createAdminClient();
  const { data: familyData } = await admin
    .from("families")
    .select("*")
    .eq("id", params.familyId)
    .single();
  if (!familyData) notFound();
  const family = familyData as Family;

  const { data: profilesData } = await admin
    .from("profiles")
    .select("*")
    .eq("family_id", family.id)
    .order("created_at");
  const profiles = (profilesData as Profile[] | null) ?? [];
  const parents = profiles.filter((p) => p.role === "parent");
  const children = profiles.filter((p) => p.role === "child");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/super" className="text-sm text-fg-muted hover:text-fg">← All families</Link>
        <h1 className="font-display font-bold text-2xl text-fg mt-2">{family.name}</h1>
        <p className="text-sm text-fg-muted">
          Created {new Date(family.created_at).toLocaleDateString("en-IN")}
        </p>
      </div>

      <SuperFamilyPlan familyId={family.id} plan={computePlan(family)} />

      <section>
        <h2 className="text-xs uppercase tracking-wide text-fg-muted mb-2">Parents</h2>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
          {parents.length === 0 && (
            <p className="px-4 py-3 text-sm text-fg-muted">No parents yet.</p>
          )}
          {parents.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-fg">{p.name ?? p.email}</p>
                <p className="text-xs text-fg-muted">{p.email}</p>
              </div>
              {p.is_super_admin && (
                <span className="text-xs bg-accent-teal/20 text-accent-teal px-2 py-1 rounded-full">Super admin</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wide text-fg-muted mb-2">Children</h2>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
          {children.length === 0 && (
            <p className="px-4 py-3 text-sm text-fg-muted">No children yet.</p>
          )}
          {children.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-fg">{c.name ?? c.email}</p>
                <p className="text-xs text-fg-muted">{c.email}</p>
              </div>
              <a
                href={`/admin/view-as-user?child=${c.id}`}
                className="text-xs bg-accent-amber/20 text-accent-amber px-3 py-1 rounded-full hover:bg-accent-amber/40 transition-colors"
              >
                View as
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
