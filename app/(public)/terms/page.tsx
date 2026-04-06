import { LegalLayout } from '../legal-layout'

export const metadata = {
  title: 'Terms of Service — Gimmelab',
  description:
    'The rules of using Gimmelab — membership, bookings, payments, and cancellations. Draft — pending legal review before launch.',
  alternates: { canonical: '/terms' },
  robots: { index: false, follow: true },
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="April 5, 2026">
      <div className="lg-callout">
        <strong>This is a working draft.</strong> It has not been reviewed by counsel. The final
        version will be published before public launch. Questions? Email{' '}
        <a href="mailto:info@dutchmike.com">info@dutchmike.com</a>.
      </div>

      <h2>1. Agreement</h2>
      <p>
        These Terms of Service ("Terms") govern your use of the Gimmelab website, mobile
        application, and booking service (collectively, the "Service") operated by Gimmelab,
        Inc. ("Gimmelab", "we", "us", "our"). By creating an account or using the Service, you
        agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account. By signing up, you represent
        that you are 18 or older and have the legal capacity to enter into a binding agreement.
      </p>

      <h2>3. Your account</h2>
      <p>
        You are responsible for keeping your account credentials secure. You are responsible for
        all activity that happens under your account. Notify us immediately at{' '}
        <a href="mailto:info@dutchmike.com">info@dutchmike.com</a> if you suspect unauthorized
        access.
      </p>
      <p>
        You agree to provide accurate information during sign-up and to keep it up to date.
        Providing false information may result in your account being suspended or terminated.
      </p>

      <h2>4. Membership and credits</h2>
      <p>
        Gimmelab offers monthly membership plans. Each plan provides a number of booking
        credits that refresh on your billing date.
      </p>

      <h3>Credit rollover</h3>
      <ul>
        <li>
          <strong>Casual:</strong> credits expire at the end of each billing cycle — no rollover.
        </li>
        <li>
          <strong>Core:</strong> up to 10% of unused credits roll over to the next month, then
          expire.
        </li>
        <li>
          <strong>Heavy:</strong> up to 15% of unused credits roll over to the next month, then
          expire.
        </li>
      </ul>
      <p>
        Top-up credit purchases expire 90 days after purchase. Bonus credits expire 60 days
        after grant.
      </p>

      <h3>Credit value</h3>
      <p>
        Credits have no cash value and cannot be redeemed for money. Credits can only be used to
        book tee times on the Gimmelab platform. We may adjust the credit cost of a tee time
        based on demand, day of week, or other factors set by the partner course.
      </p>

      <h2>5. Billing and cancellation</h2>
      <p>
        Subscriptions are billed monthly in advance via Stripe. By subscribing, you authorise us
        to charge your payment method on the same day every month until you cancel.
      </p>
      <p>
        You can cancel your subscription at any time from your Account page. When you cancel,
        your subscription remains active until the end of the current billing period, after
        which it will not renew. Credits associated with the cancelled period expire according
        to the rollover rules above.
      </p>
      <p>
        <strong>Refunds:</strong> subscription fees are generally non-refundable. If you believe
        you were charged in error, email{' '}
        <a href="mailto:info@dutchmike.com">info@dutchmike.com</a> within 30 days and we will
        review your case in good faith.
      </p>

      <h2>6. Bookings and cancellations</h2>
      <p>
        When you book a tee time, the credit cost is debited immediately from your balance. You
        receive a confirmation and a QR code for check-in at the course.
      </p>
      <p>
        You may cancel a booking up to 48 hours before tee time for a full credit refund.
        Cancellations made less than 48 hours before tee time are not refunded — the course has
        already committed the slot.
      </p>
      <p>
        No-shows result in forfeit of the credits used for the booking. Repeated no-shows may
        result in account suspension.
      </p>

      <h2>7. Your conduct at partner courses</h2>
      <p>
        When you book through Gimmelab and show up at a partner course, you agree to follow the
        course's dress code, pace of play guidelines, and any posted rules. The partner course
        may refuse entry or ask you to leave for inappropriate behaviour, and we will support
        the course's decision.
      </p>

      <h2>8. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose.</li>
        <li>Resell or transfer your bookings or account to another person.</li>
        <li>Reverse-engineer, scrape, or programmatically extract data from the Service without written permission.</li>
        <li>Interfere with the Service, probe it for security vulnerabilities, or attempt to bypass rate limits or access controls.</li>
        <li>Impersonate another person or misrepresent your affiliation with Gimmelab or a partner course.</li>
        <li>Post false reviews or ratings, or manipulate course reputations.</li>
      </ul>
      <p>
        Violation may result in immediate account termination without refund.
      </p>

      <h2>9. Partner courses — independent operators</h2>
      <p>
        Gimmelab is a booking platform. Partner golf courses are independent businesses. We do
        not own, operate, or control them. When you play at a partner course, you are a
        customer of that course for purposes of on-site conduct, safety, and liability.
      </p>
      <p>
        We do our best to verify that partner courses are operating and available when
        displayed on the platform. If a course cancels a booking because of weather, course
        closure, or operational issues, we will refund your credits in full.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        The Service, including all text, graphics, logos, and software, is owned by Gimmelab or
        its licensors and is protected by intellectual property laws. You may not copy, modify,
        distribute, or create derivative works from any part of the Service without written
        permission.
      </p>
      <p>
        You retain ownership of any content you submit (such as course ratings or profile
        photos). By submitting content, you grant us a non-exclusive, royalty-free, worldwide
        licence to use, display, and distribute it as part of operating the Service.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        The Service is provided "as is" and "as available". To the fullest extent permitted by
        law, Gimmelab disclaims all warranties, express or implied, including merchantability,
        fitness for a particular purpose, and non-infringement.
      </p>
      <p>
        We do not guarantee that the Service will be uninterrupted, error-free, or secure. We
        do not guarantee the availability of any specific tee time, course, or rate — availability
        is set by partner courses.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Gimmelab's total liability for any claim
        arising out of or relating to these Terms or the Service is limited to the amount you
        paid to Gimmelab in the twelve months immediately before the claim arose.
      </p>
      <p>
        We are not liable for indirect, incidental, special, consequential, or punitive damages,
        including lost profits, lost data, or loss of goodwill.
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless Gimmelab and its officers, directors,
        employees, and agents from any claims, damages, or expenses (including reasonable
        attorneys' fees) arising out of your misuse of the Service, your violation of these
        Terms, or your violation of any rights of another person or entity.
      </p>

      <h2>14. Termination</h2>
      <p>
        We may suspend or terminate your account at any time if you violate these Terms, if
        required by law, or if we discontinue the Service. If we terminate your account without
        cause, we will refund any unused, unexpired subscription time on a pro-rata basis.
      </p>
      <p>
        You may terminate your account at any time by cancelling your subscription from your
        Account page or emailing <a href="mailto:info@dutchmike.com">info@dutchmike.com</a>.
      </p>

      <h2>15. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Commonwealth of Pennsylvania, without
        regard to its conflict of law principles. Any dispute will be resolved in the state or
        federal courts located in Philadelphia County, Pennsylvania, and you consent to the
        jurisdiction of those courts.
      </p>

      <h2>16. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. When we make material changes, we will
        notify you by email or with a prominent notice on the Service. Continued use of the
        Service after the changes take effect constitutes acceptance of the updated Terms.
      </p>

      <h2>17. Contact</h2>
      <p>
        Questions about these Terms? Email{' '}
        <a href="mailto:info@dutchmike.com">info@dutchmike.com</a>.
      </p>
    </LegalLayout>
  )
}
