import { getAdminRevenueStats } from '@/lib/admin/queries'

export const dynamic = 'force-dynamic'

function fmt$(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtMonth(yyyymm: string) {
  const [y, m] = yyyymm.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default async function AdminRevenuePage() {
  const { allTime, monthly } = await getAdminRevenueStats()

  const stats = [
    { label: 'Total Bookings', value: allTime.totalBookings.toLocaleString() },
    { label: 'Credits Consumed', value: allTime.totalCreditsUsed.toLocaleString() + ' cr' },
    { label: 'Partner Payouts', value: fmt$(allTime.totalPayoutCents) },
    { label: 'Platform Revenue', value: fmt$(allTime.revenueCents) },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 900 }}>
      <h1 style={{ fontSize: 16, fontWeight: 900, color: '#111', letterSpacing: '-0.02em', margin: '0 0 20px' }}>
        Revenue
      </h1>

      {/* All-time stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid #e8e8e8',
            borderRadius: 4, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#111', letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>
            Last 12 Months
          </span>
        </div>
        {monthly.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'rgba(0,0,0,0.35)' }}>
            No booking data yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Month', 'Bookings', 'Credits Used', 'Gross', 'Partner Payout', 'Revenue'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
                    borderBottom: '1px solid #f0f0f0',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((row, i) => (
                <tr key={row.month} style={{ borderBottom: i < monthly.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111' }}>
                    {fmtMonth(row.month)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                    {row.bookingCount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                    {row.creditsUsed.toLocaleString()} cr
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                    {fmt$(row.grossCents)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                    {fmt$(row.payoutCents)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                    {fmt$(row.revenueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 11, color: 'rgba(0,0,0,0.35)', lineHeight: '1.5' }}>
        Gross = credits used × $1.00 per credit. Revenue = Gross − Partner Payouts. Only confirmed and completed bookings are counted.
      </p>
    </div>
  )
}
