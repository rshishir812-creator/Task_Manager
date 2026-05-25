import { redirect } from "next/navigation";
import { getParentContext } from "@/lib/auth-scope";
import { getFamilyPlan } from "@/lib/subscription";
import { PLAN_FEATURES } from "@/components/billing/premium-features";
import UpgradeActions from "@/components/billing/UpgradeActions";

export default async function UpgradePage() {
  const ctx = await getParentContext();
  if (!ctx) redirect("/login");

  const plan = await getFamilyPlan(ctx.familyId);
  const isPremium = plan.tier === "premium";

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full">
      <div className="text-center">
        <div className="text-4xl mb-2">⭐</div>
        <h1 className="font-display font-bold text-2xl text-fg">ChoreQuest Premium</h1>
        <p className="text-sm text-fg-muted mt-1">
          {isPremium
            ? "Your family is on Premium — thank you!"
            : plan.isTrialing
              ? `You're on a free trial — ${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? "" : "s"} left.`
              : "Everything your family needs to make chores stick."}
        </p>
      </div>

      {/* Comparison */}
      <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] text-sm">
          <div className="px-4 py-3 font-semibold text-fg-muted bg-bg">Feature</div>
          <div className="px-4 py-3 font-semibold text-fg-muted bg-bg text-center">Free</div>
          <div className="px-4 py-3 font-semibold text-accent-amber bg-bg text-center">Premium</div>
          {PLAN_FEATURES.map((row) => (
            <div key={row.label} className="contents">
              <div className="px-4 py-3 text-fg border-t border-[var(--border)]">{row.label}</div>
              <div className="px-4 py-3 text-fg-muted text-center border-t border-[var(--border)]">{row.free}</div>
              <div className="px-4 py-3 text-accent-amber font-semibold text-center border-t border-[var(--border)]">{row.premium}</div>
            </div>
          ))}
        </div>
      </div>

      {isPremium ? (
        <div className="rounded-xl border border-accent-amber/30 bg-accent-amber/10 px-4 py-3 text-sm text-fg text-center">
          You have full access to every feature. 🎉
        </div>
      ) : (
        <>
          <UpgradeActions plan={plan} />
          {!plan.hasTrialedBefore && (
            <p className="text-center text-[11px] text-fg-muted/70">
              No card required for the trial. Cancel anytime.
            </p>
          )}
        </>
      )}
    </div>
  );
}
