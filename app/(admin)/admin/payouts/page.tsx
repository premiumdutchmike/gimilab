import { getAdminPayoutsData } from '@/lib/admin/queries'
import PayoutButton from './payout-button'

export const dynamic = 'force-dynamic'

function fmt$(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminPayoutsPage() {
  const { pendingByPartner, recentTransfers } = await getAdminPayoutsData()

  const connectStatusColor = (s: string | null) =>
    s === 'active' ? '#16a34a' : s === 'restricted' ? '#dc2626' : 'rgba(0,0,0,0.4)'

  const transferStatusColor = (s: string) =>
    s === 'COMPLETED' ? '#16a34a' : s === 'FAILED' ? '#dc2626' : 'rgba(0,0,0,0.5)'

  return (
    <div style={{ padding: '24px', maxWidth: 900 }}>
      <h1 style={{ fontSize: 16, fontWeight: 900, color: '#111', letterSpacing: '-0.02em', margin: '0 0 20px' }}>
        Payouts
      </h1>

      {/* Pending payouts per partner */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>
            Pending Payouts
          </span>
        </div>
        {pendingByPartner.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'rgba(0,0,0,0.35)' }}>
            No approved partners yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Partner', 'Connect Status', 'Pending Bookings', 'Pending Amount', 'Action'].map(h => (
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
              {pendingByPartner.map((row, i) => {
                const hasPending = Number(row.pendingCents) > 0
                const canPay = row.stripeConnectStatus === 'active' && hasPending
                return (
                  <tr key={row.partnerId} style={{ borderBottom: i < pendingByPartner.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111' }}>
                      {row.businessName}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: connectStatusColor(row.stripeConnectStatus),
                      }}>
                        {row.stripeConnectStatus ?? 'Not connected'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                      {Number(row.pendingCount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: hasPending ? 700 : 400, color: hasPending ? '#111' : 'rgba(0,0,0,0.35)' }}>
                      {fmt$(Number(row.pendingCents))}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <PayoutButton
                        partnerId={row.partnerId}
                        pendingCents={Number(row.pendingCents)}
                        disabled={!canPay}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Transfer history */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>
            Transfer History
          </span>
        </div>
        {recentTransfers.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'rgba(0,0,0,0.35)' }}>
            No transfers yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Date', 'Partner', 'Amount', 'Bookings', 'Status', 'Stripe ID'].map(h => (
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
              {recentTransfers.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < recentTransfers.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                    {fmtDate(t.createdAt)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111' }}>
                    {t.businessName}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111' }}>
                    {fmt$(t.amountCents)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                    {t.bookingCount}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: transferStatusColor(t.status),
                    }}>
                      {t.status}
                    </span>
                    {t.failedReason && (
                      <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{t.failedReason}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'monospace', color: 'rgba(0,0,0,0.45)' }}>
                    {t.stripeTransferId ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
