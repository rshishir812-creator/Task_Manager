import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_ITEMS, groupFaqByCategory } from "@/lib/marketing/faq";
import { SITE_NAME, SITE_URL } from "@/lib/marketing/site";
import FaqAccordion from "@/components/marketing/FaqAccordion";
import FaqJsonLd from "@/components/marketing/FaqJsonLd";
import LogoMark from "@/components/marketing/LogoMark";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: `FAQ — ${SITE_NAME}`,
  description:
    "Common questions about ChoreQuest: how it works, pricing, the parent quality rating, privacy, multi-kid families, offline support, and India-friendly scheduling.",
  alternates: { canonical: "/faq" },
};

// BreadcrumbList JSON-LD — helps both Google rich results and LLM context.
function BreadcrumbJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: `${SITE_URL}/faq`,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function FaqPage() {
  const grouped = groupFaqByCategory(FAQ_ITEMS);

  return (
    <div className="dark">
      <main className="min-h-screen bg-bg text-fg">
        <FaqJsonLd items={FAQ_ITEMS} />
        <BreadcrumbJsonLd />

        {/* Top nav (light) */}
        <nav className="mx-auto max-w-3xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-fg-muted">
            <LogoMark size={20} className="text-accent-teal" />
            <span className="font-hero text-xs tracking-[0.32em] font-semibold">
              CHOREQUEST
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-accent-teal text-black font-hero font-extrabold text-sm px-4 py-2 hover:scale-[1.04] transition-transform"
          >
            Sign in
          </Link>
        </nav>

        <header className="mx-auto max-w-3xl px-6 pt-10 pb-8 text-center">
          <h1 className="font-hero font-extrabold text-fg text-4xl md:text-6xl tracking-tight">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-fg-muted max-w-xl mx-auto">
            Everything about ChoreQuest — features, pricing, privacy, and how
            we built it for Indian families.
          </p>
        </header>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          {grouped.map(([category, items]) => (
            <div key={category} className="mb-10">
              <h2 className="font-display font-bold text-accent-teal text-sm uppercase tracking-widest mb-4">
                {category}
              </h2>
              <FaqAccordion items={items} />
            </div>
          ))}

          <div className="mt-12 text-center">
            <p className="text-fg-muted text-sm">
              Didn&apos;t find your answer?
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-full bg-accent-teal text-black font-hero font-extrabold px-6 py-3 hover:scale-[1.02] transition-transform"
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
