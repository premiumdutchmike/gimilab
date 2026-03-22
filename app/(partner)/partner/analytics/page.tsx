import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPartnerByUserId, getPartnerCourse, getPartnerAnalytics } from '@/lib/partner/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics — Gimmelab Partner' }

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function PartnerAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/partner/dashboard')

  const [course, analytics] = await Promise.all([
    getPartnerCourse(partner.id),
    getPartnerAnalytics(partner.id),
  ])

  const { monthly, totals } = analytics
  const avgCredits = totals.bookingCount > 0
    ? (Number(totals.totalCredits) / Number(totals.bookingCount)).toFixed(1)
    : '0'

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 28 }}>
        Analytics
      </h1>

      {/* All-time stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 32 }}>
        {[
          { label: 'Total bookings',    value: String(totals.bookingCount) },
          { label: 'Credits earned',    value: `${Number(totals.totalCredits).toLocaleString()} cr` },
          { label: 'Total revenue',     value: formatCents(Number(totals.revenueCents)) },
          { label: 'Avg per booking',   value: `${avgCredits} cr` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '18px 20px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              {label}
            </p>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Monthly breakdown
      </p>

      {monthly.length === 0 ? (
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>No bookings yet.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Analytics will appear once members start booking your course.</p>
        </div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 140px 160px',
            padding: '10px 20px', borderBottom: '1px solid #1f1f1f',
          }}>
            {['Month', 'Bookings', 'Credits earned', 'Revenue'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                {h}
              </span>
            ))}
          </div>

          {monthly.map((row, i) => (
            <div key={row.monthKey} style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 140px 160px',
              padding: '13px 20px', alignItems: 'center',
              borderBottom: i < monthly.length - 1 ? '1px solid #1f1f1f' : 'none',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{row.month}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{Number(row.bookingCount).toLocaleString()}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                {Number(row.totalCredits).toLocaleString()} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>cr</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{formatCents(Number(row.revenueCents))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
