import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPartnerByUserId, getPartnerPayoutSummary, getPartnerPayoutTransfers } from '@/lib/partner/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payouts — Gimmelab Partner' }

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pending',   color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
  COMPLETED: { label: 'Paid',      color: '#4ade80', bg: 'rgba(74,222,128,0.10)' },
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

  const [summary, transfers] = await Promise.all([
    getPartnerPayoutSummary(partner.id),
    getPartnerPayoutTransfers(partner.id),
  ])

  const isConnected = partner.stripeConnectStatus === 'active'

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 28 }}>
        Payouts
      </h1>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 32 }}>
        {[
          { label: 'Pending balance',    value: formatCents(summary.pendingCents),  note: `${summary.pendingCount} bookings` },
          { label: 'Total paid out',     value: formatCents(summary.totalPaidCents), note: `${transfers.filter(t => t.status === 'COMPLETED').length} transfers` },
          { label: 'Payout rate',        value: '70%', note: 'of credit value per booking' },
        ].map(({ label, value, note }) => (
          <div key={label} style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '18px 20px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              {label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>
              {value}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{note}</p>
          </div>
        ))}
      </div>

      {/* Stripe not connected warning */}
      {!isConnected && (
        <div style={{
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
          padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: '#fbbf24' }}>
            Connect your Stripe account in Settings to receive payouts.
          </span>
          <a href="/partner/settings" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#fbbf24', textDecoration: 'none', marginLeft: 'auto',
          }}>
            Go to Settings →
          </a>
        </div>
      )}

      {/* How payouts work */}
      <div style={{
        background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)',
        padding: '14px 20px', marginBottom: 28,
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>How payouts work: </span>
          Each booking earns you 70% of the credit value ($0.70 per credit). Payouts are processed by Gimmelab admin — typically weekly. Your pending balance grows as new bookings come in.
        </p>
      </div>

      {/* Transfer history */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Payout history
      </p>

      {transfers.length === 0 ? (
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>No payouts yet.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Your first payout will appear here once processed.</p>
        </div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 100px 140px 160px',
            padding: '10px 20px', borderBottom: '1px solid #1f1f1f',
          }}>
            {['Date', 'Bookings', 'Amount', 'Status', 'Stripe Transfer'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                {h}
              </span>
            ))}
          </div>

          {transfers.map((t, i) => {
            const s = STATUS_STYLE[t.status] ?? { label: t.status, color: '#fff', bg: 'transparent' }
            return (
              <div key={t.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 100px 140px 160px',
                padding: '13px 20px', alignItems: 'center',
                borderBottom: i < transfers.length - 1 ? '1px solid #1f1f1f' : 'none',
              }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{formatDate(t.createdAt)}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{t.bookingCount}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{formatCents(t.amountCents)}</span>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 2,
                }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                  {t.stripeTransferId ? t.stripeTransferId.slice(0, 18) + '…' : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
