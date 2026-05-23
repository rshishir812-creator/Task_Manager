import Link from "next/link";

export const metadata = {
  title: "Open Source Notices — ChoreQuest",
};

export default function OpenSourceNotices() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/login" className="text-sm text-fg-muted hover:text-fg mb-8 block">
          ← Back
        </Link>

        <h1 className="font-display font-bold text-3xl text-fg mb-2">Open Source Notices</h1>
        <p className="text-sm text-fg-muted mb-8">
          ChoreQuest is built on the following open-source software. We are grateful to all the
          maintainers and contributors.
        </p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-fg">

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">Fonts</h2>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>
                <strong className="text-fg">Nunito</strong> by Vernon Adams, Cyreal, Jacques Le Bailly —
                SIL Open Font License 1.1
              </li>
              <li>
                <strong className="text-fg">Baloo 2</strong> by Ek Type — SIL Open Font License 1.1
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">Icons</h2>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>
                <strong className="text-fg">lucide-react</strong> by the Lucide contributors — ISC License
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">Frameworks & libraries</h2>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li><strong className="text-fg">Next.js</strong> by Vercel — MIT License</li>
              <li><strong className="text-fg">React</strong> by Meta — MIT License</li>
              <li><strong className="text-fg">Tailwind CSS</strong> by Tailwind Labs — MIT License</li>
              <li><strong className="text-fg">framer-motion</strong> by Framer — MIT License</li>
              <li><strong className="text-fg">Supabase JS</strong> by Supabase — MIT License</li>
              <li><strong className="text-fg">@ducanh2912/next-pwa</strong> — MIT License</li>
              <li><strong className="text-fg">TypeScript</strong> by Microsoft — Apache 2.0 License</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">Emoji</h2>
            <p className="text-fg-muted">
              ChoreQuest renders Unicode emoji characters (🎮, 🛡️, 🔥, ⚔️, 🏆, etc.). These are
              Unicode standard codepoints and are free to use. Visual rendering is provided by your
              operating system&apos;s emoji font (Apple Color Emoji on iOS / macOS, Segoe UI Emoji on
              Windows, Noto Color Emoji on Android / Linux). ChoreQuest does not ship or
              redistribute any emoji font.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">User content</h2>
            <p className="text-fg-muted">
              Profile photos are sourced exclusively from Google OAuth and remain owned by the user.
              ChoreQuest displays them but does not store, modify, or redistribute them.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] flex gap-4 text-xs text-fg-muted">
          <Link href="/legal/terms" className="hover:text-fg">Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:text-fg">Privacy Policy</Link>
          <Link href="/legal/notices" className="hover:text-fg">Open Source Notices</Link>
        </div>
      </div>
    </main>
  );
}
