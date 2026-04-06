import { LegalLayout } from '../legal-layout'

export const metadata = {
  title: 'Privacy Policy — Gimmelab',
  description:
    'How Gimmelab collects, uses, and protects your data. Draft — pending legal review before launch.',
  alternates: { canonical: '/privacy' },
  robots: { index: false, follow: true },
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="April 5, 2026">
      <div className="lg-callout">
        <strong>This is a working draft.</strong> It has not been reviewed by counsel. The final
        version will be published before public launch. If you have questions about how we
        handle your data, email <a href="mailto:info@dutchmike.com">info@dutchmike.com</a>.
      </div>

      <h2>1. Who we are</h2>
      <p>
        Gimmelab ("we", "us", "our") operates the website at{' '}
        <a href="https://gimmelab.com">gimmelab.com</a> and the associated booking service. This
        privacy policy explains what personal information we collect, how we use it, who we
        share it with, and what rights you have.
      </p>
      <p>
        <strong>Data controller:</strong> Gimmelab, Inc., Philadelphia, PA, USA.<br />
        <strong>Contact:</strong> <a href="mailto:info@dutchmike.com">info@dutchmike.com</a>
      </p>

      <h2>2. What we collect</h2>

      <h3>Information you give us</h3>
      <ul>
        <li>
          <strong>Account information:</strong> name, email address, password (hashed), phone
          number, handicap index if provided.
        </li>
        <li>
          <strong>Billing information:</strong> subscription tier, billing history. Card details
          are handled directly by Stripe — we never see or store your full payment card number.
        </li>
        <li>
          <strong>Booking information:</strong> courses you book, dates, playing partners you
          invite, post-round ratings you leave.
        </li>
        <li>
          <strong>Support communications:</strong> messages you send us when you contact support.
        </li>
      </ul>

      <h3>Information we collect automatically</h3>
      <ul>
        <li>
          <strong>Device and log data:</strong> IP address, browser type, operating system,
          pages visited, timestamps. Used for security, debugging, and product analytics.
        </li>
        <li>
          <strong>Cookies and similar technologies:</strong> we use cookies to keep you signed
          in, remember preferences, and measure how the product is used.
        </li>
        <li>
          <strong>Approximate location:</strong> derived from your IP address, used to surface
          nearby courses. We do not collect precise GPS location unless you explicitly grant
          permission in a browser or mobile context.
        </li>
      </ul>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To provide the service — create your account, process subscription billing, confirm bookings, send you QR check-in codes and round reminders.</li>
        <li>To operate and improve the product — debug issues, understand which features are used, measure reliability.</li>
        <li>To communicate with you — transactional emails (receipts, booking confirmations, service notifications) and, if you opt in, product updates.</li>
        <li>To prevent fraud and abuse — detect suspicious activity, enforce our Terms of Service, investigate security incidents.</li>
        <li>To comply with legal obligations — respond to lawful requests, preserve records required by tax and accounting rules.</li>
      </ul>

      <h2>4. Who we share information with</h2>
      <p>
        We do not sell your personal information. We share limited information with third
        parties that help us operate the service:
      </p>
      <ul>
        <li>
          <strong>Stripe</strong> — payment processing and subscription billing.
        </li>
        <li>
          <strong>Supabase</strong> — database, authentication, and file storage.
        </li>
        <li>
          <strong>Upstash</strong> — caching and background job queues.
        </li>
        <li>
          <strong>Resend</strong> — transactional email delivery.
        </li>
        <li>
          <strong>PostHog</strong> — product analytics.
        </li>
        <li>
          <strong>Vercel</strong> — web hosting and content delivery.
        </li>
        <li>
          <strong>Partner courses</strong> — when you book a tee time, we share the name and
          number of players in your group with the course operator so they can check you in.
        </li>
      </ul>
      <p>
        We may also disclose information if required by law, subpoena, court order, or to
        protect our rights, property, or safety, or that of our users or others.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We use first-party cookies to keep you signed in, remember your preferences, and
        measure product usage. We use a small number of third-party analytics cookies (from
        PostHog) to understand how the product is used in aggregate.
      </p>
      <p>
        You can disable cookies in your browser settings, but some parts of the service
        (including signing in) will not work properly without them.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We keep account information for as long as your account is active. If you close your
        account, we delete or anonymise personal data within 90 days, except for records we are
        required to retain for tax, accounting, fraud prevention, or legal purposes.
      </p>
      <p>
        Aggregated and anonymised data that cannot reasonably be used to identify you may be
        retained indefinitely.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to:
      </p>
      <ul>
        <li>Access the personal information we hold about you.</li>
        <li>Correct information that is inaccurate or incomplete.</li>
        <li>Delete your personal information (subject to legal retention requirements).</li>
        <li>Export your information in a portable format.</li>
        <li>Object to or restrict certain types of processing.</li>
        <li>Opt out of marketing emails at any time (use the unsubscribe link in any email, or contact us).</li>
      </ul>
      <p>
        To exercise any of these rights, email{' '}
        <a href="mailto:info@dutchmike.com">info@dutchmike.com</a>. We will respond within 30
        days.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard security practices to protect your data — encrypted transport
        (HTTPS), encrypted-at-rest databases, row-level access controls, and third-party audited
        payment processing via Stripe. No system is perfectly secure. If we become aware of a
        breach that affects your personal information, we will notify you as required by law.
      </p>

      <h2>9. Children</h2>
      <p>
        Gimmelab is not directed to children under 13, and we do not knowingly collect personal
        information from them. If you believe a child has provided us with personal information,
        email <a href="mailto:info@dutchmike.com">info@dutchmike.com</a> and we will delete it.
      </p>

      <h2>10. International users</h2>
      <p>
        Gimmelab is operated from the United States. If you access the service from outside the
        US, your information will be transferred to, stored, and processed in the US. By using
        the service you consent to this transfer.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. When we make material changes, we will
        notify you by email or with a prominent notice on the site. The "Last updated" date at
        the top of this page tells you when the current version took effect.
      </p>

      <h2>12. Contact us</h2>
      <p>
        Questions or concerns? Email{' '}
        <a href="mailto:info@dutchmike.com">info@dutchmike.com</a>.
      </p>
    </LegalLayout>
  )
}
