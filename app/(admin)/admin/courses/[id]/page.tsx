// app/(admin)/admin/courses/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseDetail, getCourseBookings, getCoursePayouts } from '@/lib/admin/queries'
import { CourseSidebar } from './course-sidebar'
import { CourseSettingsForm } from './course-settings-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// Helper to format cents as dollars
function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(t: string | null | undefined) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

const BOOKING_STATUS_COLOR: Record<string, string> = {
  CONFIRMED:  '#16a34a',
  COMPLETED:  '#0ea5e9',
  CANCELLED:  'rgba(0,0,0,0.3)',
  NO_SHOW:    '#dc2626',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const course = await getCourseDetail(id)
  return { title: course ? `${course.courseName} — Admin` : 'Course — Admin' }
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ section?: string }>
}) {
  const { id } = await params
  const { section = 'overview' } = await searchParams

  const course = await getCourseDetail(id)
  if (!course) notFound()

  const [bookings, payouts] = await Promise.all([
    section === 'bookings' || section === 'overview' ? getCourseBookings(id) : Promise.resolve([]),
    section === 'payouts' ? getCoursePayouts(course.partnerId, id) : Promise.resolve(null),
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

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Back link */}
      <Link href="/admin/courses" style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>
        ← Courses
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: 24 }}>
        {course.courseName}
      </h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
        {statBox('Total Bookings', String(course.totalBookings))}
        {statBox('Partner Earnings', fmtCents(Number(course.totalEarningsCents)), '#16a34a')}
        {statBox('Payout Rate', course.payoutRate ? `${Math.round(Number(course.payoutRate) * 100)}%` : '—')}
        {statBox('Status', course.courseStatus.toUpperCase(), course.courseStatus === 'active' ? '#16a34a' : course.courseStatus === 'pending' ? '#d97706' : '#dc2626')}
      </div>

      {/* Sidebar + content */}
      <div style={{ display: 'flex', background: '#fff', border: '1px solid #e8e8e8', minHeight: 500 }}>
        <CourseSidebar courseId={id} currentSection={section} courseStatus={course.courseStatus} />

        <div style={{ flex: 1, padding: '28px 32px' }}>

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <div>
              {/* Course info */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 10 }}>Course Info</p>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 1.8 }}>
                  <div>{course.address}</div>
                  <div>Partner: <strong style={{ color: '#111' }}>{course.businessName}</strong></div>
                  <div>{course.holes} holes</div>
                </div>
              </div>

              {/* Activity log */}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>
                Recent Activity
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {bookings.slice(0, 20).map(b => (
                  <div key={b.bookingId} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', minWidth: 70 }}>{fmtDate(b.date)}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: BOOKING_STATUS_COLOR[b.status] ?? '#111', minWidth: 80,
                    }}>{b.status}</span>
                    <span style={{ fontSize: 13, color: '#111', flex: 1 }}>
                      {b.memberName ?? b.memberEmail} · {fmtTime(b.startTime)} · {b.creditCost}cr
                    </span>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>No bookings yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {section === 'bookings' && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>All Bookings</p>
              <div style={{ border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 100px 100px 90px', padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                  {['Date', 'Member', 'Time', 'Credits', 'Status', 'Payout'].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
                  ))}
                </div>
                {bookings.map((b, i) => (
                  <div key={b.bookingId} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 100px 100px 90px', padding: '11px 16px', alignItems: 'center', borderBottom: i < bookings.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtDate(b.date)}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{b.memberName ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{b.memberEmail}</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtTime(b.startTime)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{b.creditCost}cr</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: BOOKING_STATUS_COLOR[b.status] ?? '#111' }}>{b.status}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{b.payoutStatus}</span>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>No bookings.</div>
                )}
              </div>
            </div>
          )}

          {/* ── PAYOUTS ── */}
          {section === 'payouts' && payouts && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 8 }}>Partner Payouts</p>
              <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 24 }}>Showing all transfers for partner: {course.businessName}</p>
              <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 2, padding: '16px 20px', marginBottom: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 4 }}>Pending (this course)</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.03em' }}>{fmtCents(payouts.pendingCents)}</p>
              </div>
              <div style={{ border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 120px 80px 120px 1fr', padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                  {['Date', 'Amount', 'Bookings', 'Status', 'Stripe ID'].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
                  ))}
                </div>
                {payouts.transfers.map((t, i) => (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '130px 120px 80px 120px 1fr', padding: '11px 16px', alignItems: 'center', borderBottom: i < payouts.transfers.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtDate(t.createdAt)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{fmtCents(t.amountCents)}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{t.bookingCount}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: t.status === 'COMPLETED' ? '#16a34a' : t.status === 'FAILED' ? '#dc2626' : '#d97706' }}>{t.status}</span>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' }}>{t.stripeTransferId ?? '—'}</span>
                  </div>
                ))}
                {payouts.transfers.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>No transfers yet.</div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === 'settings' && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>Course Settings</p>
              <CourseSettingsForm course={course} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
