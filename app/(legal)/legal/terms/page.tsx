import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "The ChoreQuest Terms of Service. Governed by Indian law.",
  alternates: { canonical: "/legal/terms" },
  robots: { index: true, follow: true },
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/login" className="text-sm text-fg-muted hover:text-fg mb-8 block">
          ← Back
        </Link>

        <h1 className="font-display font-bold text-3xl text-fg mb-2">Terms of Service</h1>
        <p className="text-sm text-fg-muted mb-8">Last updated: May 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-fg">

          <section>
            <p className="text-fg-muted">
              By using ChoreQuest, you agree to these terms. Please read them. If you do not agree,
              do not use the app.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">1. Who can use ChoreQuest</h2>
            <p className="text-fg-muted">
              ChoreQuest is intended for use by parents and guardians who set up and manage family
              accounts on behalf of their children. By creating an account, you confirm that you are
              at least 18 years old and are the parent or legal guardian of any children added to
              your family.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">2. Your account</h2>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>You are responsible for maintaining the security of your account</li>
              <li>You are responsible for all activity that occurs under your account and family</li>
              <li>You must not share your account credentials with anyone outside your family</li>
              <li>You must provide accurate information when setting up your family</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">3. Acceptable use</h2>
            <p className="text-fg-muted mb-2">You agree not to:</p>
            <ul className="list-disc list-inside text-fg-muted space-y-1">
              <li>Use ChoreQuest for any unlawful purpose</li>
              <li>Attempt to access another family&apos;s data</li>
              <li>Reverse-engineer, scrape, or otherwise extract data from the app automatically</li>
              <li>Use the app in a way that could harm, harass, or endanger a child</li>
              <li>Attempt to circumvent any security or access controls</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">4. Service availability</h2>
            <p className="text-fg-muted">
              ChoreQuest is provided &quot;as is&quot; without any guarantee of uptime, availability, or
              fitness for a particular purpose. We make reasonable efforts to keep the service
              running, but we are not liable for any downtime, data loss, or interruption of service.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">5. Limitation of liability</h2>
            <p className="text-fg-muted">
              To the fullest extent permitted by law, ChoreQuest and its developers shall not be
              liable for any indirect, incidental, special, or consequential damages arising from
              your use of the app, including but not limited to loss of data, loss of revenue, or
              any harm to your children arising from content entered into the app. Your sole remedy
              for dissatisfaction with the service is to stop using it.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">6. Termination</h2>
            <p className="text-fg-muted">
              We reserve the right to suspend or terminate accounts that violate these terms, engage
              in abusive behaviour, or pose a risk to other users. You may delete your account and
              all associated data at any time by contacting the developer directly.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">7. Changes to these terms</h2>
            <p className="text-fg-muted">
              We may update these terms from time to time. If we make material changes, we will
              notify you via the email address on your account. Continued use of the app after
              notification constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">8. Governing law</h2>
            <p className="text-fg-muted">
              These terms are governed by the laws of India. Any disputes shall be subject to
              the exclusive jurisdiction of courts in India.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base text-fg mb-3">9. Contact</h2>
            <p className="text-fg-muted">
              Questions about these terms? Reach out to the developer directly.
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
