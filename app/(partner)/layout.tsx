import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId } from '@/lib/partner/queries'
import { getNextOnboardingStep } from '@/lib/partner/get-onboarding-step'
import PartnerNav from '@/components/partner-nav'
import Link from 'next/link'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let partner
  try {
    partner = await getPartnerByUserId(user.id)
  } catch (err) {
    console.error('[partner-layout] query failed', err)
    redirect('/login')
  }

  if (!partner) redirect('/login')

  // If onboarding is incomplete, redirect to the next step
  if (!partner.onboardingComplete) {
    const nextStep = await getNextOnboardingStep(partner.id, false)
    if (nextStep) redirect(nextStep)
  }

  // Check if Stripe Connect is pending (skipped during onboarding). The new
  // Stripe Connect flow writes to partner.stripeConnectId (the onboarding
  // wizard and the settings page both use this column); the legacy
  // stripeConnectAccountId column is kept for backwards compat.
  const stripeConnectPending = !partner.stripeConnectId && !partner.stripeConnectAccountId

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0C0C0B',
        color: '#F4EEE3',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {stripeConnectPending && (
        <div
          className="pl-stripe-banner"
          style={{
            background: '#BF7B2E',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span className="pl-stripe-msg" style={{ fontSize: 13, fontWeight: 600, color: '#0C0C0B' }}>
            Payouts on hold — connect your bank account to start receiving payments.
          </span>
          <Link
            href="/partner/settings"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#BF7B2E',
              background: '#F4EEE3',
              padding: '6px 14px',
              borderRadius: 2,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Connect now →
          </Link>
        </div>
      )}
      <PartnerNav businessName={partner.businessName} />
      <main style={{ flex: 1 }}>{children}</main>

      <style>{`
        @media (max-width: 640px) {
          .pl-stripe-banner { padding: 10px 16px !important; }
          .pl-stripe-msg { font-size: 12px !important; }
        }
      `}</style>
    </div>
  )
}
