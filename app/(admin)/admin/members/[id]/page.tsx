// app/(admin)/admin/members/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getMemberDetail, getMemberLedger, getMemberBookings } from '@/lib/admin/queries'
import { setMemberSuspended } from '@/actions/admin/suspend-member'
import { cancelSubscription, changeSubscriptionTier } from '@/actions/admin/change-subscription'
import { MemberSidebar } from './member-sidebar'
import { CreditAdjustmentForm } from './credit-adjustment-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

const LEDGER_COLOR: Record<string, string> = {
  SUBSCRIPTION_GRANT: '#16a34a',
  ROLLOVER_GRANT:     '#16a34a',
  BONUS_GRANT:        '#16a34a',
  TOP_UP_PURCHASE:    '#16a34a',
  BOOKING_DEBIT:      '#111',
  BOOKING_REFUND:     '#0ea5e9',
  ADMIN_ADJUSTMENT:   '#d97706',
  CREDIT_EXPIRY:      'rgba(0,0,0,0.3)',
}

const BOOKING_STATUS_COLOR: Record<string, string> = {
  CONFIRMED:  '#16a34a',
  COMPLETED:  '#0ea5e9',
  CANCELLED:  'rgba(0,0,0,0.3)',
  NO_SHOW:    '#dc2626',
}

const TIER_COLOR: Record<string, string> = {
  casual: '#0ea5e9',
  core:   '#a855f7',
  heavy:  '#16a34a',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const member = await getMemberDetail(id)
  return { title: member ? `${member.fullName ?? member.email} — Admin` : 'Member — Admin' }
}

async function handleChangeTier(stripeSubscriptionId: string, fd: FormData) {
  'use server'
  const tier = fd.get('tier') as 'casual' | 'core' | 'heavy'
  await changeSubscriptionTier(stripeSubscriptionId, tier)
}

async function handleCancelSubscription(stripeSubscriptionId: string) {
  'use server'
  await cancelSubscription(stripeSubscriptionId)
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ section?: string; action?: string }>
}) {
  const { id } = await params
  const { section = 'overview', action } = await searchParams

  const member = await getMemberDetail(id)
  if (!member) notFound()

  // Handle suspend/activate — redirect immediately to clear the `action` param,
  // preventing the mutation from re-firing on page reload.
  if (action === 'suspend' || action === 'activate') {
    await setMemberSuspended(id, action === 'suspend')
    redirect(`/admin/members/${id}?section=overview`)
  }

  const [ledger, bookings] = await Promise.all([
    section === 'credits' || section === 'overview' ? getMemberLedger(id) : Promise.resolve([]),
    section === 'bookings' ? getMemberBookings(id) : Promise.resolve([]),
  ])

  const statBox = (label: string, value: string, color = '#111') => (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', padding: '16px 20px', flex: 1 }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )

  const tierColor = member.subscriptionTier ? TIER_COLOR[member.subscriptionTier] ?? '#111' : 'rgba(0,0,0,0.3)'

  const changeTierAction = member.stripeSubscriptionId
    ? handleChangeTier.bind(null, member.stripeSubscriptionId)
    : null

  const cancelSubAction = member.stripeSubscriptionId
    ? handleCancelSubscription.bind(null, member.stripeSubscriptionId)
    : null

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <Link href="/admin/members" style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>
        ← Members
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: 4 }}>
        {member.fullName ?? '—'}
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', marginBottom: 24 }}>{member.email}</p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
        {statBox('Credits', String(member.creditBalance), '#16a34a')}
        {statBox('Plan', member.subscriptionTier?.toUpperCase() ?? 'None', tierColor)}
        {statBox('Total Rounds', String(member.totalRounds))}
        {statBox('Status', member.isSuspended ? 'SUSPENDED' : (member.subscriptionStatus?.toUpperCase() ?? '—'), member.isSuspended ? '#dc2626' : '#16a34a')}
      </div>

      {/* Sidebar + content */}
      <div style={{ display: 'flex', background: '#fff', border: '1px solid #e8e8e8', minHeight: 500 }}>
        <MemberSidebar memberId={id} currentSection={section} isSuspended={member.isSuspended ?? false} />

        <div style={{ flex: 1, padding: '28px 32px' }}>

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <div>
              <div style={{ marginBottom: 28, fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 1.8 }}>
                <div>Joined: {fmtDate(member.createdAt)}</div>
                <div>Stripe Customer: <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{member.stripeCustomerId ?? '—'}</span></div>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>
                Recent Activity
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {ledger.slice(0, 20).map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', minWidth: 70 }}>{fmtDate(e.createdAt)}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: LEDGER_COLOR[e.type] ?? '#111', minWidth: 140 }}>{e.type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: e.amount > 0 ? '#16a34a' : '#dc2626', minWidth: 50 }}>
                      {e.amount > 0 ? '+' : ''}{e.amount}cr
                    </span>
                    {e.notes && <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{e.notes}</span>}
                  </div>
                ))}
                {ledger.length === 0 && <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>No activity.</p>}
              </div>
            </div>
          )}

          {/* ── CREDITS ── */}
          {section === 'credits' && (
            <div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>Ledger</p>
                  <div style={{ border: '1px solid #e8e8e8' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 60px 80px 100px', padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                      {['Date', 'Type', 'Amount', 'Notes', 'Expires'].map(h => (
                        <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
                      ))}
                    </div>
                    {ledger.map((e, i) => (
                      <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 60px 80px 100px', padding: '9px 16px', alignItems: 'center', borderBottom: i < ledger.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{fmtDate(e.createdAt)}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: LEDGER_COLOR[e.type] ?? '#111' }}>{e.type.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: e.amount > 0 ? '#16a34a' : '#dc2626' }}>
                          {e.amount > 0 ? '+' : ''}{e.amount}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.notes ?? '—'}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>
                          {e.expiresAt ? fmtDate(e.expiresAt) : '—'}
                        </span>
                      </div>
                    ))}
                    {ledger.length === 0 && (
                      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>No entries.</div>
                    )}
                  </div>
                </div>
                <CreditAdjustmentForm userId={id} />
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {section === 'bookings' && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>Bookings</p>
              <div style={{ border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 80px 100px 60px', padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                  {['Date', 'Course', 'Time', 'Credits', 'Status', 'Rating'].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
                  ))}
                </div>
                {bookings.map((b, i) => (
                  <div key={b.bookingId} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 80px 100px 60px', padding: '11px 16px', alignItems: 'center', borderBottom: i < bookings.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtDate(b.date)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{b.courseName}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtTime(b.startTime)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{b.creditCost}cr</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: BOOKING_STATUS_COLOR[b.status] ?? '#111' }}>{b.status}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{b.ratingScore ? `${b.ratingScore}/5` : '—'}</span>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>No bookings.</div>
                )}
              </div>
            </div>
          )}

          {/* ── SUBSCRIPTION ── */}
          {section === 'subscription' && (
            <div style={{ maxWidth: 480 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>Subscription</p>
              <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 2, padding: '20px 24px', marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 1.9 }}>
                  <div>Plan: <strong style={{ color: tierColor, textTransform: 'capitalize' }}>{member.subscriptionTier ?? 'None'}</strong></div>
                  <div>Status: <strong>{member.subscriptionStatus ?? '—'}</strong></div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>{member.stripeSubscriptionId ?? 'No subscription'}</div>
                </div>
              </div>

              {member.stripeSubscriptionId && changeTierAction && cancelSubAction && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <form action={changeTierAction}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', display: 'block', marginBottom: 4 }}>
                          Change Tier
                        </label>
                        <select name="tier" defaultValue={member.subscriptionTier ?? ''} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e8e8e8', borderRadius: 2, fontSize: 13, fontFamily: 'inherit' }}>
                          <option value="casual">Casual — $99/mo</option>
                          <option value="core">Core — $149/mo</option>
                          <option value="heavy">Heavy — $199/mo</option>
                        </select>
                      </div>
                      <button type="submit" style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Update
                      </button>
                    </div>
                  </form>

                  <form action={cancelSubAction}>
                    <button type="submit" style={{ padding: '8px 16px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 2, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Cancel Subscription
                    </button>
                  </form>
                </div>
              )}

              {!member.stripeSubscriptionId && (
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>No active Stripe subscription.</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
