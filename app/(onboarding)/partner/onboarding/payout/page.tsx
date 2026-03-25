import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { partners, courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { OnboardingStepper } from '@/components/partner/onboarding-stepper'
import { PayoutActions } from './payout-actions'

export default async function PayoutPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/apply/signup')

  const partner = await db.query.partners.findFirst({ where: eq(partners.userId, user.id) })
  if (!partner) redirect('/partner/apply/signup')

  const course = await db.query.courses.findFirst({ where: eq(courses.partnerId, partner.id) })
  if (!course) redirect('/partner/onboarding/course')
  if (!course.gimmelabRateCents) redirect('/partner/onboarding/pricing')

  const connected = params.status === 'connected' || !!partner.stripeConnectAccountId

  return (
    <>
      <OnboardingStepper currentStep={3} />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{
          background: '#1E1D1B',
          border: '1px solid rgba(229,221,211,0.1)',
          borderRadius: 2,
          padding: 40,
        }}>
          {!connected && (
            <>
              <p style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#BF7B2E', marginBottom: 10,
              }}>
                Step 3 of 5
              </p>
              <h2 style={{
                fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em',
                color: '#F4EEE3', marginBottom: 8,
              }}>
                Connect your payout account
              </h2>
              <p style={{ fontSize: 14, color: '#847C72', marginBottom: 24, lineHeight: 1.5 }}>
                You'll receive monthly payouts directly to your bank. Powered by Stripe.
              </p>
              <div style={{ borderTop: '1px solid rgba(229,221,211,0.1)', marginBottom: 40 }} />
            </>
          )}

          {connected ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(191,123,46,0.15)',
                border: '2px solid #BF7B2E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 24,
              }}>
                ✓
              </div>
              <h3 style={{
                fontSize: 20, fontWeight: 700, color: '#F4EEE3', marginBottom: 10,
              }}>
                Bank account connected
              </h3>
              <p style={{ fontSize: 14, color: '#847C72', marginBottom: 32, lineHeight: 1.5 }}>
                You're all set to receive payouts. We'll settle monthly, net 30.
              </p>
              <a href="/partner/onboarding/slots" style={{
                display: 'inline-block',
                background: '#BF7B2E',
                color: '#fff',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '14px 28px', borderRadius: 2, textDecoration: 'none',
              }}>
                Continue to Inventory →
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              {/* Stripe "S" stand-in logo */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(229,221,211,0.06)',
                border: '1px solid rgba(229,221,211,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, fontSize: 26, color: '#F4EEE3', fontWeight: 900,
                letterSpacing: '-0.03em',
              }}>
                S
              </div>
              <h3 style={{
                fontSize: 18, fontWeight: 600, color: '#F4EEE3',
                marginBottom: 12, textAlign: 'center',
              }}>
                Secure bank connection via Stripe
              </h3>
              <p style={{
                fontSize: 14, color: '#847C72', textAlign: 'center',
                lineHeight: 1.6, marginBottom: 28, maxWidth: 380,
              }}>
                Gimmelab uses Stripe Connect to send payouts directly to your bank account.
                Setup takes 2–3 minutes.
              </p>

              <div style={{ marginBottom: 32, alignSelf: 'flex-start', paddingLeft: '10%' }}>
                {['No setup fees', 'Monthly automatic transfers', 'Supports US bank accounts'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ color: '#BF7B2E', fontWeight: 700, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 14, color: '#F4EEE3' }}>{item}</span>
                  </div>
                ))}
              </div>

              <PayoutActions />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
