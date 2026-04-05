import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import StripeConnectButton from './stripe-connect-button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings — Gimmelab Partner' }

const CONNECT_STATUS = {
  active: {
    label: 'Active',
    sub: 'Your Stripe account is connected and payouts are enabled.',
    color: '#5FB380',
    bg: 'rgba(95,179,128,0.12)',
  },
  pending: {
    label: 'Setup incomplete',
    sub: 'Your Stripe account was created but onboarding is not yet complete.',
    color: '#BF7B2E',
    bg: 'rgba(191,123,46,0.12)',
  },
  restricted: {
    label: 'Restricted',
    sub: 'Your Stripe account has restrictions. Complete the requirements to resume payouts.',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.10)',
  },
} as const

export default async function PartnerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; refresh?: string }>
}) {
  const { connected, refresh } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)

  const connectStatus = partner.stripeConnectStatus as keyof typeof CONNECT_STATUS | null
  const isActive = connectStatus === 'active'
  const statusInfo = connectStatus ? CONNECT_STATUS[connectStatus] ?? null : null

  return (
    <div className="ps-wrap" style={{ padding: '32px 28px', maxWidth: 720, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BF7B2E', marginBottom: 6 }}>
          {partner.businessName}
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F4EEE3', letterSpacing: '-0.03em', lineHeight: 1 }}>
          Settings
        </h1>
      </div>

      {/* Return banner */}
      {connected && !isActive && (
        <div style={{
          background: 'rgba(191,123,46,0.08)', border: '1px solid rgba(191,123,46,0.3)',
          borderRadius: 4, padding: '12px 16px', marginBottom: 24,
          fontSize: 13, color: '#BF7B2E',
        }}>
          Thanks for completing the Stripe flow. Your account status will update shortly — we'll sync it automatically.
        </div>
      )}
      {connected && isActive && (
        <div style={{
          background: 'rgba(95,179,128,0.1)', border: '1px solid rgba(95,179,128,0.3)',
          borderRadius: 4, padding: '12px 16px', marginBottom: 24,
          fontSize: 13, color: '#5FB380',
        }}>
          Stripe account connected successfully. Payouts are now enabled.
        </div>
      )}
      {refresh && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 4, padding: '12px 16px', marginBottom: 24,
          fontSize: 13, color: '#f87171',
        }}>
          The Stripe onboarding link expired. Please start the setup again below.
        </div>
      )}

      {/* Payout setup section */}
      <section style={{
        background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)',
        borderRadius: 4, overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(244,238,227,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#F4EEE3', marginBottom: 2 }}>Payout account</p>
            <p style={{ fontSize: 12, color: 'rgba(244,238,227,0.35)' }}>
              Stripe Express — receive payouts for bookings at your course
            </p>
          </div>
          {statusInfo && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: statusInfo.color, background: statusInfo.bg,
              padding: '4px 10px', borderRadius: 2, flexShrink: 0,
            }}>
              {statusInfo.label}
            </span>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          {!partner.stripeConnectId ? (
            <>
              <p style={{ fontSize: 13, color: 'rgba(244,238,227,0.5)', lineHeight: 1.6, marginBottom: 20, maxWidth: 480 }}>
                Connect a Stripe account to receive payouts when members book at your course.
                You'll be taken to Stripe to complete identity verification and banking details.
              </p>
              <StripeConnectButton label="Connect Stripe account" />
            </>
          ) : isActive ? (
            <>
              <p style={{ fontSize: 13, color: 'rgba(244,238,227,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                {statusInfo!.sub}
              </p>
              {course?.payoutRate && (
                <div style={{
                  display: 'inline-flex', alignItems: 'baseline', gap: 6,
                  background: 'rgba(191,123,46,0.1)', border: '1px solid rgba(191,123,46,0.25)',
                  borderRadius: 2, padding: '8px 14px', marginBottom: 20,
                }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#BF7B2E', letterSpacing: '-0.03em' }}>
                    {Math.round(Number(course.payoutRate) * 100)}%
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(244,238,227,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    payout rate
                  </span>
                </div>
              )}
              <div>
                <a
                  href={`https://dashboard.stripe.com/express/${partner.stripeConnectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'transparent', border: '1px solid rgba(244,238,227,0.15)',
                    borderRadius: 4, padding: '10px 18px',
                    fontSize: 12, fontWeight: 600, color: 'rgba(244,238,227,0.6)',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                >
                  Manage in Stripe Dashboard
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 2h3v3M10 2L5 7M4 3H2v7h7V8"/>
                  </svg>
                </a>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'rgba(244,238,227,0.5)', lineHeight: 1.6, marginBottom: 20, maxWidth: 480 }}>
                {statusInfo?.sub}
              </p>
              <StripeConnectButton label="Complete Stripe setup" />
            </>
          )}
        </div>
      </section>

      {/* Account info section */}
      <section style={{
        background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(244,238,227,0.08)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F4EEE3' }}>Account details</p>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Business name', value: partner.businessName },
            { label: 'Partner status', value: partner.status },
            { label: 'Account ID', value: partner.id },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 12, color: 'rgba(244,238,227,0.4)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, color: 'rgba(244,238,227,0.7)', fontWeight: 600, fontFamily: 'monospace' }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .ps-wrap { padding: 24px 16px 48px !important; }
        }
      `}</style>
    </div>
  )
}
