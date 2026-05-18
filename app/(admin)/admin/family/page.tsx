import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";
import FamilyPanel from "@/components/admin/FamilyPanel";
import type { Profile, ChildInvitation, Family } from "@/lib/types";

export default async function FamilyPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const admin = createAdminClient();
  const [familyRes, parentsRes, childrenRes, invitationsRes] = await Promise.all([
    admin.from("families").select("*").eq("id", ctx.familyId).single(),
    admin.from("profiles").select("*").eq("family_id", ctx.familyId).eq("role", "parent").order("created_at"),
    admin.from("profiles").select("*").eq("family_id", ctx.familyId).eq("role", "child").order("created_at"),
    admin.from("child_invitations").select("*").eq("family_id", ctx.familyId).is("accepted_at", null).order("created_at", { ascending: false }),
  ]);

  const family = familyRes.data as Family | null;
  const parents = (parentsRes.data as Profile[] | null) ?? [];
  const children = (childrenRes.data as Profile[] | null) ?? [];
  const invitations = (invitationsRes.data as ChildInvitation[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Family 👨‍👩‍👧</h1>
        <p className="text-sm text-fg-muted mt-1">{family?.name ?? "Your family"}</p>
      </div>

      {/* Parents */}
      <section>
        <h2 className="font-display font-semibold text-fg mb-3 text-sm uppercase tracking-wide text-fg-muted">Parents</h2>
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
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

      <FamilyPanel
        initialChildren={children}
        initialInvitations={invitations}
      />
    </div>
  );
}
