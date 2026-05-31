import Link from "next/link";
import LogoMark from "@/components/marketing/LogoMark";
import Hero from "@/components/marketing/Hero";

// Full-width hero section for the public homepage. Wraps the existing OAuth
// <Hero /> client island with server-rendered marketing copy and section
// navigation so the above-the-fold HTML is rich for crawlers.
export default function MarketingHero() {
  return (
    <header className="relative overflow-hidden">
      {/* Accent vignette */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.18]"
        style={{
          background:
            "radial-gradient(closest-side, var(--accent-teal), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Top nav */}
      <nav className="relative mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-fg-muted">
          <LogoMark size={20} className="text-accent-teal" />
          <span className="font-hero text-xs tracking-[0.32em] font-semibold">
            CHOREQUEST
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-fg-muted">
          <Link href="#how-it-works" className="hover:text-fg transition-colors">
            How it works
          </Link>
          <Link href="#features" className="hover:text-fg transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-fg transition-colors">
            Pricing
          </Link>
          <Link href="/faq" className="hover:text-fg transition-colors">
            FAQ
          </Link>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-accent-teal text-black font-hero font-extrabold text-sm px-4 py-2 hover:scale-[1.04] transition-transform"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero block */}
      <div className="relative mx-auto max-w-5xl px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-semibold text-accent-teal tracking-widest mb-4">
            FOR INDIAN FAMILIES · IST · NO ADS · COPPA-COMPLIANT
          </p>
          <h1 className="font-hero font-extrabold text-fg text-balance leading-[0.95] tracking-tight text-[clamp(2.25rem,6vw,4.5rem)]">
            Make chores
            <br />
            <span className="text-accent-teal">a quest.</span> Not a fight.
          </h1>
          <p className="mt-5 text-fg-muted leading-relaxed text-[clamp(0.95rem,2vw,1.125rem)] max-w-lg">
            ChoreQuest turns daily habits into a game your kids actually want to
            play. XP, streaks, badges, parent approval, optional quality
            ratings — installable on any phone, free to start.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-fg-muted">
            <li>✅ Free forever for 1 kid</li>
            <li>✅ 7-day Premium trial</li>
            <li>✅ Works offline-friendly</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-6 md:p-8">
          <Hero errorMsg={null} showHeadline={false} />
        </div>
      </div>
    </header>
  );
}
