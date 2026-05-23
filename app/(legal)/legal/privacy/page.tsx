import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — ChoreQuest",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/login" className="text-sm text-fg-muted hover:text-fg mb-8 block">
          ← Back
        </Link>

        <h1 className="font-display font-bold text-3xl text-fg mb-2">Privacy Policy</h1>
        <p className="text-sm text-fg-muted mb-8">Last updated: May 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-fg">

          <section>
            <p>
              ChoreQuest is a family-focused app designed to help parents and children build
              daily habits through gamified chore tracking. We take the privacy of your family —
              especially your children — seriously. This policy explains what data we collect,
              how we use it, and what rights you have over it.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">1. What data we collect</h2>
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-medium text-fg mb-1">Parent account</p>
                <ul className="list-disc list-inside text-fg-muted space-y-1">
                  <li>Name and email address (from Google sign-in)</li>
                  <li>Profile photo (from Google, if provided)</li>
                  <li>Account creation timestamp</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-fg mb-1">Child profiles</p>
                <ul className="list-disc list-inside text-fg-muted space-y-1">
                  <li>Name (entered by the parent)</li>
                  <li>Email address (used only to invite the child to the app)</li>
                  <li>Age bracket (used to suggest appropriate chores during setup)</li>
                  <li>Chore completion history, points, streaks, and badges</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-fg mb-1">Usage data</p>
                <ul className="list-disc list-inside text-fg-muted space-y-1">
                  <li>Timestamps of actions (completing a chore, redeeming a reward, etc.)</li>
                  <li>Basic server logs retained by our hosting provider (Vercel)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">2. How we use your data</h2>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>To operate the app — showing chores, streaks, badges, and rewards to the right family</li>
              <li>To calculate progress metrics (streaks, XP, levels) that keep children motivated</li>
              <li>To allow parents to monitor and manage their children&apos;s chore activity</li>
              <li>To send in-app and browser notifications you have explicitly enabled</li>
            </ul>
            <p className="mt-3 text-fg-muted">
              We do <strong className="text-fg">not</strong> use your data for advertising, profiling,
              or any purpose beyond operating ChoreQuest for your family.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">3. Data sharing</h2>
            <p className="text-fg-muted mb-3">
              We do not sell, rent, or share your data with any third parties for commercial purposes.
              Your family&apos;s data is shared only with the infrastructure services required to run the app:
            </p>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li><strong className="text-fg">Supabase</strong> — database and authentication hosting (SOC 2 Type II certified, data encrypted at rest)</li>
              <li><strong className="text-fg">Vercel</strong> — app hosting and edge delivery</li>
              <li><strong className="text-fg">Google</strong> — OAuth sign-in provider only; we receive only your name, email, and profile photo</li>
            </ul>
            <p className="mt-3 text-fg-muted">
              No analytics platforms, advertising networks, or data brokers have access to your data.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">4. Children&apos;s privacy (COPPA)</h2>
            <p className="text-fg-muted mb-3">
              ChoreQuest is designed for use by parents on behalf of children. We comply with the
              Children&apos;s Online Privacy Protection Act (COPPA):
            </p>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>A parent or guardian must create the family account and invite children</li>
              <li>We obtain your explicit consent before any child data is stored</li>
              <li>Child accounts cannot be created independently — only a verified parent can add a child</li>
              <li>Parents can delete any child&apos;s data at any time (see Section 6)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">5. Security</h2>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>All data is encrypted at rest and in transit (TLS)</li>
              <li>Row-level security ensures your family&apos;s data is only accessible to your family</li>
              <li>No passwords are stored — authentication is handled entirely by Google OAuth</li>
              <li>Database access is strictly controlled and not accessible to unauthorised parties</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">6. Your rights — data deletion</h2>
            <p className="text-fg-muted mb-3">As a parent, you are in full control of your family&apos;s data:</p>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>
                <strong className="text-fg">Remove a child:</strong> go to Family settings → remove the child.
                This permanently deletes all their data from our database.
              </li>
              <li>
                <strong className="text-fg">Delete your account:</strong> contact the developer
                directly and we will delete all data associated with your family within 30 days.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">7. Data retention</h2>
            <p className="text-fg-muted">
              Data is retained for as long as your family account is active. Deleted child profiles
              and removed chore histories are permanently purged from our database immediately.
              Server logs are retained by Vercel for up to 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">8. Changes to this policy</h2>
            <p className="text-fg-muted">
              If we make material changes to how we handle your data, we will notify you via the
              email address on your account before the changes take effect. Continued use of the
              app after that notification constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">9. Contact</h2>
            <p className="text-fg-muted">
              Questions about this policy? Reach out to the developer directly.
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
