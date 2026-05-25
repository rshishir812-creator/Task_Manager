import { NextResponse } from "next/server";
import { getParentContext } from "@/lib/auth-scope";
import { PAYMENTS_ENABLED } from "@/lib/payments";

/**
 * POST /api/parent/subscribe
 *   Placeholder for the paid upgrade. Billing isn't wired up yet, so this
 *   gracefully reports "coming soon" and changes no tier. When a provider is
 *   configured (see lib/payments.ts), create the order here and return its
 *   details for the client to complete checkout.
 */
export async function POST() {
  const ctx = await getParentContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.profile.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!PAYMENTS_ENABLED) {
    return NextResponse.json({
      comingSoon: true,
      message: "Paid plans are coming soon — we'll let you know the moment they're ready.",
    });
  }

  // Future: const order = await createUpgradeOrder(ctx.familyId); return order details.
  return NextResponse.json({ comingSoon: true });
}
