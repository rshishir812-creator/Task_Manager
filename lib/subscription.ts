import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Family } from "@/lib/types";

// Re-export so existing server imports (`@/lib/subscription`) keep working.
export { FREE_LIMITS, TRIAL_DAYS } from "@/lib/plan-limits";

/**
 * Resolved plan for a family. `hasPremiumAccess` is the single flag every gate
 * keys off — true when the family is on Premium OR inside an active trial.
 * All fields are primitives so this can be passed from server to client components.
 */
export type Plan = {
  tier: "free" | "premium";
  isTrialing: boolean;
  trialEndsAt: string | null; // ISO string
  trialDaysLeft: number;
  hasTrialedBefore: boolean; // a trial was started before → hide the opt-in button
  hasPremiumAccess: boolean;
};

type FamilyPlanFields = Pick<
  Family,
  "subscription_tier" | "trial_started_at" | "trial_ends_at"
>;

/** Pure: derive a Plan from a family's subscription fields. */
export function computePlan(family: FamilyPlanFields | null): Plan {
  if (!family) {
    return {
      tier: "free",
      isTrialing: false,
      trialEndsAt: null,
      trialDaysLeft: 0,
      hasTrialedBefore: false,
      hasPremiumAccess: false,
    };
  }

  const tier = family.subscription_tier === "premium" ? "premium" : "free";
  const trialEnd = family.trial_ends_at ? new Date(family.trial_ends_at) : null;
  const now = Date.now();
  const isTrialing =
    tier !== "premium" && trialEnd !== null && trialEnd.getTime() > now;
  const trialDaysLeft =
    isTrialing && trialEnd
      ? Math.max(0, Math.ceil((trialEnd.getTime() - now) / 86_400_000))
      : 0;

  return {
    tier,
    isTrialing,
    trialEndsAt: trialEnd ? trialEnd.toISOString() : null,
    trialDaysLeft,
    hasTrialedBefore: family.trial_started_at !== null,
    hasPremiumAccess: tier === "premium" || isTrialing,
  };
}

/** Fetch + compute a family's plan (server-only; uses the service-role client). */
export async function getFamilyPlan(familyId: string): Promise<Plan> {
  const { data } = await createAdminClient()
    .from("families")
    .select("subscription_tier, trial_started_at, trial_ends_at")
    .eq("id", familyId)
    .single();
  return computePlan(data as FamilyPlanFields | null);
}

/** Standard 402 response for a blocked premium action. */
export function upgradeRequiredResponse(message: string) {
  return NextResponse.json(
    { error: message, code: "UPGRADE_REQUIRED" },
    { status: 402 },
  );
}
