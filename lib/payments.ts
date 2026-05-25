/**
 * Payment provider seam.
 *
 * Billing isn't wired up yet. This is the single place a provider (Razorpay,
 * Stripe, etc.) will plug into later — create an order/checkout here and the
 * /api/parent/subscribe route + UpgradeModal will light up. Until then,
 * PAYMENTS_ENABLED stays false and the upgrade flow shows a graceful
 * "coming soon" message instead of charging anyone.
 */
export const PAYMENTS_ENABLED = false;

export interface UpgradeOrder {
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Placeholder. Throws until a real provider is configured. Wire the chosen
 * provider's order/checkout creation in here and flip PAYMENTS_ENABLED to true.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createUpgradeOrder(familyId: string): Promise<UpgradeOrder> {
  throw new Error("Payments are not configured yet");
}
