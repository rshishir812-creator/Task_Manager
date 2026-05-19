import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentContext } from "@/lib/auth-scope";
import RedemptionsPanel from "@/components/admin/RedemptionsPanel";
import { getPointsBalance } from "@/lib/rewards";
import type { Profile, Redemption } from "@/lib/types";

export default async function AdminRedemptionsPage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const admin = createAdminClient();
  const [{ data: redemptionsData }, { data: kidsData }] = await Promise.all([
    admin
      .from("redemptions")
      .select("*")
      .eq("family_id", ctx.familyId)
      .order("requested_at", { ascending: false })
      .limit(200),
    admin
      .from("profiles")
      .select("*")
      .eq("family_id", ctx.familyId)
      .eq("role", "child"),
  ]);

  const redemptions = (redemptionsData as Redemption[] | null) ?? [];
  const kids = (kidsData as Profile[] | null) ?? [];

  // Compute balances for each child so the parent can see "this child has X
  // available, this request would cost Y"
  const balances: Record<string, { earned: number; spent: number; available: number }> = {};
  await Promise.all(
    kids.map(async (k) => {
      balances[k.id] = await getPointsBalance(k.id);
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Redemption Requests 🎁</h1>
        <p className="text-sm text-fg-muted mt-1">
          Review what your kids want to spend their points on. Approve to deduct from their balance.
        </p>
      </div>
      <RedemptionsPanel
        initialRedemptions={redemptions}
        kids={kids}
        balances={balances}
      />
    </div>
  );
}
