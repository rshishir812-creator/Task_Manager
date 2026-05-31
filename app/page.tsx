import type { Metadata } from "next";
import MarketingHero from "@/components/marketing/MarketingHero";
import HowItWorks from "@/components/marketing/HowItWorks";
import Features from "@/components/marketing/Features";
import Pricing from "@/components/marketing/Pricing";
import FaqAccordion from "@/components/marketing/FaqAccordion";
import FaqJsonLd from "@/components/marketing/FaqJsonLd";
import OrgJsonLd from "@/components/marketing/OrgJsonLd";
import Footer from "@/components/marketing/Footer";
import Link from "next/link";
import { FAQ_ITEMS } from "@/lib/marketing/faq";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

// Subset of FAQ items featured inline on the homepage. Full list lives at /faq.
const HOMEPAGE_FAQ_IDS = [
  "what-is-chorequest",
  "is-it-free",
  "quality-rating",
  "platforms",
  "coppa-safe",
] as const;

export default function Home() {
  // Signed-in users are redirected to their dashboard by middleware before
  // reaching this page (see middleware.ts root branch), so this only renders
  // for signed-out visitors. Installed PWA users stay on their existing flow.
  const homepageFaq = FAQ_ITEMS.filter((item) =>
    (HOMEPAGE_FAQ_IDS as readonly string[]).includes(item.id),
  );

  return (
    // Force dark mode on marketing pages — matches the existing /login look.
    <div className="dark">
      <main className="min-h-screen bg-bg text-fg">
        <OrgJsonLd />

        <MarketingHero />
        <HowItWorks />
        <Features />
        <Pricing />

        {/* FAQ teaser */}
        <section id="faq" className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <h2 className="font-hero font-extrabold text-fg text-3xl md:text-5xl tracking-tight text-center">
            Questions, answered
          </h2>
          <p className="mt-4 text-center text-fg-muted">
            The short version. See the{" "}
            <Link
              href="/faq"
              className="text-accent-teal font-semibold hover:underline"
            >
              full FAQ
            </Link>{" "}
            for everything.
          </p>
          <div className="mt-10">
            <FaqAccordion items={homepageFaq} defaultOpen={0} />
            <FaqJsonLd items={homepageFaq} />
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="inline-block rounded-full border-2 border-accent-teal text-fg font-hero font-extrabold px-6 py-3 hover:bg-accent-teal/10 transition-colors"
            >
              See all questions →
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <div className="rounded-3xl border border-accent-teal/30 bg-bg-elevated p-10">
            <h2 className="font-hero font-extrabold text-fg text-2xl md:text-4xl tracking-tight">
              Ready to turn tomorrow into a quest?
            </h2>
            <p className="mt-3 text-fg-muted">
              Free forever for one kid. Premium adds the rest of the family.
            </p>
            <Link
              href="/login"
              className="mt-7 inline-block rounded-full bg-accent-teal text-black font-hero font-extrabold text-base md:text-lg px-8 py-4 hover:scale-[1.02] transition-transform"
            >
              Start free →
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
