import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse, getPartnerBookings } from '@/lib/partner/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bookings — Gimmelab Partner' }

function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED:  { label: 'Confirmed',  color: '#4ade80', bg: 'rgba(74,222,128,0.10)' },
  COMPLETED:  { label: 'Completed',  color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' },
  CANCELLED:  { label: 'Cancelled',  color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
  NO_SHOW:    { label: 'No-show',    color: '#fbbf24', bg: 'rgba(251,191,36,0.10)'  },
}

const PAYOUT_STYLES: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Pending',   color: 'rgba(255,255,255,0.3)' },
  PROCESSED:  { label: 'Paid out',  color: '#4ade80' },
  HELD:       { label: 'Held',      color: '#fbbf24' },
}

type Tab = 'upcoming' | 'past'

export default async function PartnerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = rawTab === 'past' ? 'past' : 'upcoming'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  const rows = await getPartnerBookings(course.id, tab)

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6 }}>
            {course.name}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Bookings
          </h1>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
          {rows.length} {tab} booking{rows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid #1a1a1a' }}>
        {(['upcoming', 'past'] as Tab[]).map(t => (
          <a
            key={t}
            href={`/partner/bookings?tab=${t}`}
            style={{
              padding: '10px 20px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: tab === t ? '#fff' : 'rgba(255,255,255,0.3)',
              borderBottom: tab === t ? '2px solid #38bdf8' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            {t}
          </a>
        ))}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div style={{
          background: '#0f1923', border: '1px solid #1a1a1a',
          padding: '60px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
            No {tab} bookings yet.
          </p>
          {tab === 'upcoming' && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
              Bookings will appear here once members reserve tee times at your course.
            </p>
          )}
        </div>
      ) : (
        <div style={{ background: '#0f1923', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
          {/* Table head */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '130px 80px 1fr 80px 90px 90px',
            gap: 0,
            padding: '10px 20px',
            borderBottom: '1px solid #1a1a1a',
          }}>
            {['Date', 'Time', 'Member', 'Credits', 'Status', 'Payout'].map(h => (
              <span key={h} style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, i) => {
            const status = STATUS_STYLES[row.status] ?? { label: row.status, color: '#fff', bg: 'transparent' }
            const payout = PAYOUT_STYLES[row.payoutStatus ?? 'PENDING'] ?? { label: row.payoutStatus ?? '—', color: 'rgba(255,255,255,0.3)' }
            return (
              <div
                key={row.bookingId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '130px 80px 1fr 80px 90px 90px',
                  gap: 0,
                  padding: '14px 20px',
                  borderBottom: i < rows.length - 1 ? '1px solid #1a1a1a' : 'none',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {formatDate(row.date)}
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  {formatTime(row.startTime)}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {row.memberName ?? '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                    {row.memberEmail}
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                  {row.creditCost} cr
                </span>
                <span style={{
                  display: 'inline-block',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: status.color,
                  background: status.bg,
                  padding: '3px 8px', borderRadius: 2,
                }}>
                  {status.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: payout.color }}>
                  {payout.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
