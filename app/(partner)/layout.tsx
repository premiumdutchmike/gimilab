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

  // Check if Stripe Connect is pending (skipped during onboarding)
  const stripeConnectPending = !partner.stripeConnectAccountId

  return (
    <div className="min-h-screen bg-[#090f1a] flex flex-col">
      {stripeConnectPending && (
        <div style={{
          background: '#BF7B2E',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            Payouts on hold — connect your bank account to start receiving payments.
          </span>
          <Link
            href="/partner/settings"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#0C0C0B',
              background: '#fff',
              padding: '6px 14px',
              borderRadius: 2,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Connect Now →
          </Link>
        </div>
      )}
      <PartnerNav businessName={partner.businessName} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
