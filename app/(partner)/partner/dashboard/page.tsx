import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse, getPartnerDashboardStats } from '@/lib/partner/queries'

export const metadata = { title: 'Partner Dashboard — Gimmelab' }

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  const dashboardStats = await getPartnerDashboardStats(partner.id).catch(() => ({
    totalBookings: 0,
    thisWeekBookingCount: 0,
    activeSlotCount: 0,
    revenueCents: 0,
  }))

  const stats = [
    { label: 'Total bookings', value: String(dashboardStats.totalBookings), accent: false },
    { label: 'This week', value: String(dashboardStats.thisWeekBookingCount), accent: true },
    { label: 'Active slots', value: String(dashboardStats.activeSlotCount), accent: false },
    { label: 'Revenue', value: formatCents(dashboardStats.revenueCents), accent: false },
  ]

  return (
    <div style={{ padding: '48px 32px 80px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Pending approval banner */}
      {course.status === 'pending' && (
        <div
          style={{
            marginBottom: 24,
            padding: '14px 18px',
            border: '1px solid rgba(191,123,46,0.3)',
            background: 'rgba(191,123,46,0.08)',
            color: '#BF7B2E',
            borderRadius: 2,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Your course is pending approval. We&apos;ll notify you when it goes live.
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#BF7B2E',
            marginBottom: 10,
          }}
        >
          Partner Dashboard
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px, 4vw, 44px)',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            color: '#F4EEE3',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {course.name}
        </h1>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2,
          background: 'rgba(244,238,227,0.08)',
          marginBottom: 28,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#1E1D1B',
              padding: '28px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#847C72',
              }}
            >
              {stat.label}
            </span>
            <span
              style={{
                fontSize: 40,
                fontWeight: 900,
                letterSpacing: '-0.035em',
                color: stat.accent ? '#BF7B2E' : '#F4EEE3',
                lineHeight: 0.95,
              }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Empty state — first-time partner with no activity */}
      {dashboardStats.totalBookings === 0 && (
        <div
          style={{
            background: '#1E1D1B',
            border: '1px solid rgba(244,238,227,0.08)',
            borderLeft: '3px solid #BF7B2E',
            padding: '22px 26px',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#F4EEE3',
              marginBottom: 6,
              letterSpacing: '-0.01em',
            }}
          >
            No bookings yet.
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#847C72',
              lineHeight: 1.6,
            }}
          >
            You&apos;ll see activity here as members book your course. Tee times are generated every night from the blocks you set up in{' '}
            <Link
              href="/partner/inventory"
              style={{
                color: '#BF7B2E',
                textDecoration: 'none',
                borderBottom: '1px solid #BF7B2E',
                paddingBottom: 1,
              }}
            >
              Inventory →
            </Link>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { href: '/partner/bookings', label: 'Today\u2019s bookings', sub: 'Tee sheet and check-ins' },
          { href: '/partner/inventory', label: 'Manage inventory', sub: 'Blocks and slot generation' },
          { href: '/partner/pricing', label: 'Rate & pricing', sub: 'Credit cost and overrides' },
          { href: '/partner/payouts', label: 'Payouts', sub: 'Transfer history' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'block',
              background: '#1E1D1B',
              border: '1px solid rgba(244,238,227,0.08)',
              padding: '18px 20px',
              textDecoration: 'none',
              transition: 'border-color 0.15s, transform 0.12s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F4EEE3', marginBottom: 3, letterSpacing: '-0.01em' }}>
              {link.label} →
            </div>
            <div style={{ fontSize: 11, color: '#847C72', letterSpacing: '0.02em' }}>
              {link.sub}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
