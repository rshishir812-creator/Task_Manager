import Link from "next/link";
import LogoMark from "@/components/marketing/LogoMark";
import { SITE_NAME } from "@/lib/marketing/site";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-bg-elevated/40">
      <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-fg-muted">
          <LogoMark size={22} className="text-accent-teal" />
          <span className="font-display font-bold text-fg">{SITE_NAME}</span>
          <span className="text-xs">· Made with love in India 🇮🇳</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-fg-muted">
          <Link href="/faq" className="hover:text-fg transition-colors">
            FAQ
          </Link>
          <Link href="/legal/privacy" className="hover:text-fg transition-colors">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-fg transition-colors">
            Terms
          </Link>
          <Link href="/legal/notices" className="hover:text-fg transition-colors">
            Open source
          </Link>
          <Link
            href="/login"
            className="text-accent-teal font-semibold hover:underline"
          >
            Sign in →
          </Link>
        </nav>
      </div>
    </footer>
  );
}
