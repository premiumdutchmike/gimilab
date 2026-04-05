import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPartnerByUserId, getPartnerPayoutSummary, getPartnerPayoutTransfers, getPartnerCourse } from '@/lib/partner/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payouts — Gimmelab Partner' }

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pending',   color: '#BF7B2E', bg: 'rgba(191,123,46,0.12)' },
  COMPLETED: { label: 'Paid',      color: '#5FB380', bg: 'rgba(95,179,128,0.12)' },
  FAILED:    { label: 'Failed',    color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function PartnerPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/partner/dashboard')

  const [summary, transfers, course] = await Promise.all([
    getPartnerPayoutSummary(partner.id),
    getPartnerPayoutTransfers(partner.id),
    getPartnerCourse(partner.id),
  ])

  const isConnected = partner.stripeConnectStatus === 'active'
  const payoutPct = course?.payoutRate ? Math.round(Number(course.payoutRate) * 100) : 85
  const payoutPerCredit = course?.payoutRate ? `$${Number(course.payoutRate).toFixed(2)}` : '$0.85'

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F4EEE3', letterSpacing: '-0.03em', marginBottom: 28 }}>
        Payouts
      </h1>

      {/* Summary strip */}
      <div className="p-pay-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 32 }}>
        {[
          { label: 'Pending balance',    value: formatCents(summary.pendingCents),  note: `${summary.pendingCount} bookings` },
          { label: 'Total paid out',     value: formatCents(summary.totalPaidCents), note: `${transfers.filter(t => t.status === 'COMPLETED').length} transfers` },
          { label: 'Payout rate',        value: `${payoutPct}%`, note: 'of credit value per booking' },
        ].map(({ label, value, note }) => (
          <div key={label} style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', padding: '18px 20px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.35)', marginBottom: 8 }}>
              {label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#F4EEE3', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>
              {value}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(244,238,227,0.35)' }}>{note}</p>
          </div>
        ))}
      </div>

      {/* Stripe not connected warning */}
      {!isConnected && (
        <div style={{
          background: 'rgba(191,123,46,0.08)', border: '1px solid rgba(191,123,46,0.3)',
          padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: '#BF7B2E' }}>
            Connect your Stripe account in Settings to receive payouts.
          </span>
          <a href="/partner/settings" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#BF7B2E', textDecoration: 'none', marginLeft: 'auto',
          }}>
            Go to Settings →
          </a>
        </div>
      )}

      {/* How payouts work */}
      <div style={{
        background: 'rgba(191,123,46,0.05)', border: '1px solid rgba(191,123,46,0.15)',
        padding: '14px 20px', marginBottom: 28,
      }}>
        <p style={{ fontSize: 12, color: 'rgba(244,238,227,0.5)', lineHeight: 1.6 }}>
          <span style={{ color: '#BF7B2E', fontWeight: 700 }}>How payouts work: </span>
          Each booking earns you {payoutPct}% of the credit value ({payoutPerCredit} per credit). Payouts are processed by Gimmelab admin — typically monthly. Your pending balance grows as new bookings come in.
        </p>
      </div>

      {/* Transfer history */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.35)', marginBottom: 12 }}>
        Payout history
      </p>

      {transfers.length === 0 ? (
        <div style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(244,238,227,0.35)', marginBottom: 6 }}>No payouts yet.</p>
          <p style={{ fontSize: 12, color: 'rgba(244,238,227,0.25)' }}>Your first payout will appear here once processed.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="p-pay-desktop" style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 100px 140px 160px',
              padding: '10px 20px', borderBottom: '1px solid rgba(244,238,227,0.08)',
            }}>
              {['Date', 'Bookings', 'Amount', 'Status', 'Stripe Transfer'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.3)' }}>
                  {h}
                </span>
              ))}
            </div>

            {transfers.map((t, i) => {
              const s = STATUS_STYLE[t.status] ?? { label: t.status, color: '#F4EEE3', bg: 'transparent' }
              return (
                <div key={t.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 100px 140px 160px',
                  padding: '13px 20px', alignItems: 'center',
                  borderBottom: i < transfers.length - 1 ? '1px solid rgba(244,238,227,0.08)' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(244,238,227,0.6)' }}>{formatDate(t.createdAt)}</span>
                  <span style={{ fontSize: 12, color: 'rgba(244,238,227,0.6)' }}>{t.bookingCount}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#BF7B2E' }}>{formatCents(t.amountCents)}</span>
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 2,
                  }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(244,238,227,0.3)', fontFamily: 'monospace' }}>
                    {t.stripeTransferId ? t.stripeTransferId.slice(0, 18) + '…' : '—'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Mobile card list */}
          <div className="p-pay-cards">
            {transfers.map((t) => {
              const s = STATUS_STYLE[t.status] ?? { label: t.status, color: '#F4EEE3', bg: 'transparent' }
              return (
                <div key={t.id} className="p-pay-card">
                  <div className="p-pay-card-primary" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                    {formatCents(t.amountCents)}
                  </div>
                  <div className="p-pay-card-row">
                    <span className="p-pay-card-label">Date</span>
                    <span className="p-pay-card-value">{formatDate(t.createdAt)}</span>
                  </div>
                  <div className="p-pay-card-row">
                    <span className="p-pay-card-label">Bookings</span>
                    <span className="p-pay-card-value">{t.bookingCount}</span>
                  </div>
                  <div className="p-pay-card-row">
                    <span className="p-pay-card-label">Status</span>
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 2,
                    }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="p-pay-card-row">
                    <span className="p-pay-card-label">Transfer</span>
                    <span className="p-pay-card-value" style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(244,238,227,0.4)' }}>
                      {t.stripeTransferId ? t.stripeTransferId.slice(0, 14) + '…' : '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <style>{`
        .p-pay-cards { display: none; }
        @media (max-width: 899px) {
          .p-pay-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .p-pay-desktop { display: none !important; }
          .p-pay-cards {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .p-pay-card {
            background: #1E1D1B;
            border: 1px solid rgba(244,238,227,0.08);
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .p-pay-card-primary {
            font-size: 18px;
            font-weight: 900;
            color: #BF7B2E;
            letter-spacing: -0.02em;
          }
          .p-pay-card-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
          }
          .p-pay-card-label {
            font-size: 11px;
            color: #847C72;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
          }
          .p-pay-card-value {
            font-size: 13px;
            color: #F4EEE3;
            font-weight: 600;
          }
        }
        @media (max-width: 640px) {
          .p-pay-stats {
            grid-template-columns: 1fr !important;
          }
          .p-pay-card { padding: 16px; }
        }
      `}</style>
    </div>
  )
}
