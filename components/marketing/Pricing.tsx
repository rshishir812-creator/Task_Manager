import Link from "next/link";
import { PLAN_COPY } from "@/lib/marketing/site";

export default function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <h2 className="font-hero font-extrabold text-fg text-3xl md:text-5xl tracking-tight text-center">
        Start free. Upgrade when you grow.
      </h2>
      <p className="mt-4 text-center text-fg-muted max-w-2xl mx-auto">
        No credit card to start. The free plan stays free forever.
      </p>

      <div className="mt-12 grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {/* Free */}
        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-8">
          <p className="font-display font-bold text-fg-muted text-sm tracking-widest mb-2">
            {PLAN_COPY.free.name.toUpperCase()}
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-hero font-extrabold text-fg text-4xl">
              {PLAN_COPY.free.price}
            </span>
            <span className="text-fg-muted text-sm">
              {PLAN_COPY.free.priceSuffix}
            </span>
          </div>
          <ul className="mt-6 space-y-2.5">
            {PLAN_COPY.free.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-fg"
              >
                <span className="text-accent-teal mt-0.5" aria-hidden="true">
                  ✓
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="mt-8 block w-full text-center rounded-full border-2 border-accent-teal text-fg font-hero font-extrabold px-6 py-3 hover:bg-accent-teal/10 transition-colors"
          >
            Start free →
          </Link>
        </div>

        {/* Premium */}
        <div className="relative rounded-2xl border-2 border-accent-teal bg-bg-elevated p-8">
          <span className="absolute -top-3 left-8 rounded-full bg-accent-teal text-black text-xs font-extrabold px-3 py-1">
            FOR GROWING FAMILIES
          </span>
          <p className="font-display font-bold text-accent-teal text-sm tracking-widest mb-2">
            {PLAN_COPY.premium.name.toUpperCase()}
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-hero font-extrabold text-fg text-4xl">
              {PLAN_COPY.premium.price}
            </span>
          </div>
          <p className="text-fg-muted text-sm">{PLAN_COPY.premium.priceSuffix}</p>
          <ul className="mt-6 space-y-2.5">
            {PLAN_COPY.premium.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-fg"
              >
                <span className="text-accent-teal mt-0.5" aria-hidden="true">
                  ✓
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="mt-8 block w-full text-center rounded-full bg-accent-teal text-black font-hero font-extrabold px-6 py-3 hover:scale-[1.02] transition-transform"
          >
            Start {PLAN_COPY.premium.trialDays}-day free trial →
          </Link>
        </div>
      </div>
    </section>
  );
}
