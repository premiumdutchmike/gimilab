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

      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F4EEE3', letterSpacing: '-0.03em', marginBottom: 28 }}>
        Analytics
      </h1>

      {/* All-time stat strip */}
      <div className="p-an-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 32 }}>
        {[
          { label: 'Total bookings',    value: String(totals.bookingCount) },
          { label: 'Credits earned',    value: `${Number(totals.totalCredits).toLocaleString()} cr` },
          { label: 'Total revenue',     value: formatCents(Number(totals.revenueCents)) },
          { label: 'Avg per booking',   value: `${avgCredits} cr` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', padding: '18px 20px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.35)', marginBottom: 8 }}>
              {label}
            </p>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#F4EEE3', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.35)', marginBottom: 12 }}>
        Monthly breakdown
      </p>

      {monthly.length === 0 ? (
        <div style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(244,238,227,0.35)', marginBottom: 6 }}>No bookings yet.</p>
          <p style={{ fontSize: 12, color: 'rgba(244,238,227,0.25)' }}>Analytics will appear once members start booking your course.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="p-an-desktop" style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 140px 160px',
              padding: '10px 20px', borderBottom: '1px solid rgba(244,238,227,0.08)',
            }}>
              {['Month', 'Bookings', 'Credits earned', 'Revenue'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.3)' }}>
                  {h}
                </span>
              ))}
            </div>

            {monthly.map((row, i) => (
              <div key={row.monthKey} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 140px 160px',
                padding: '13px 20px', alignItems: 'center',
                borderBottom: i < monthly.length - 1 ? '1px solid rgba(244,238,227,0.08)' : 'none',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F4EEE3' }}>{row.month}</span>
                <span style={{ fontSize: 13, color: 'rgba(244,238,227,0.7)' }}>{Number(row.bookingCount).toLocaleString()}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#BF7B2E' }}>
                  {Number(row.totalCredits).toLocaleString()} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(244,238,227,0.35)' }}>cr</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#5FB380' }}>{formatCents(Number(row.revenueCents))}</span>
              </div>
            ))}
          </div>

          {/* Mobile card list */}
          <div className="p-an-cards">
            {monthly.map((row) => (
              <div key={row.monthKey} className="p-an-card">
                <div className="p-an-card-primary">{row.month}</div>
                <div className="p-an-card-row">
                  <span className="p-an-card-label">Bookings</span>
                  <span className="p-an-card-value">{Number(row.bookingCount).toLocaleString()}</span>
                </div>
                <div className="p-an-card-row">
                  <span className="p-an-card-label">Credits</span>
                  <span className="p-an-card-value" style={{ color: '#BF7B2E', fontWeight: 700 }}>
                    {Number(row.totalCredits).toLocaleString()} cr
                  </span>
                </div>
                <div className="p-an-card-row">
                  <span className="p-an-card-label">Revenue</span>
                  <span className="p-an-card-value" style={{ color: '#5FB380', fontWeight: 700, fontFamily: 'var(--font-geist-mono)' }}>
                    {formatCents(Number(row.revenueCents))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .p-an-cards { display: none; }
        @media (max-width: 899px) {
          .p-an-desktop { display: none !important; }
          .p-an-cards {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .p-an-card {
            background: #1E1D1B;
            border: 1px solid rgba(244,238,227,0.08);
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .p-an-card-primary {
            font-size: 15px;
            font-weight: 700;
            color: #F4EEE3;
            letter-spacing: -0.01em;
          }
          .p-an-card-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
          }
          .p-an-card-label {
            font-size: 11px;
            color: #847C72;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
          }
          .p-an-card-value {
            font-size: 13px;
            color: #F4EEE3;
            font-weight: 600;
          }
        }
        @media (max-width: 768px) {
          .p-an-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .p-an-stats {
            grid-template-columns: 1fr !important;
          }
          .p-an-card { padding: 16px; }
        }
      `}</style>
    </div>
  )
}
