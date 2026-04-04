import { redirect } from 'next/navigation'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users, bookings, teeTimeSlots, courses, creditLedger } from '@/lib/db/schema'
import { and, eq, gte, count, countDistinct, desc, sql, asc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TIER_CREDITS } from '@/lib/stripe/client'
import { FadeIn } from '@/components/lab-animate'

export const metadata = { title: 'Dashboard — gimmelab' }

function getLedgerLabel(entry: { type: string; notes: string | null; referenceId: string | null }): { title: string; sub: string } {
  switch (entry.type) {
    case 'SUBSCRIPTION_GRANT':
      return { title: 'Credits renewed', sub: 'Monthly renewal' }
    case 'BOOKING_DEBIT':
      return { title: 'Tee time booked', sub: 'Credit debit' }
    case 'BOOKING_REFUND':
      return { title: 'Booking cancelled', sub: 'Credit refund' }
    case 'TOP_UP_PURCHASE':
      return { title: 'Top-up purchase', sub: 'Credit top-up' }
    case 'ADMIN_ADJUSTMENT':
      return { title: 'Admin adjustment', sub: entry.notes ?? '' }
    case 'BONUS_GRANT':
      return { title: 'Bonus credits', sub: entry.notes ?? '' }
    case 'CREDIT_EXPIRY':
      return { title: 'Credits expired', sub: 'Expiry event' }
    case 'ROLLOVER_GRANT':
      return { title: 'Credits rolled over', sub: 'Rollover from prior month' }
    default:
      return { title: 'Credit event', sub: entry.type }
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0]

  const [dbUser, balance, monthRoundsResult, coursesVisitedResult, nextTeeTimeResult, recentLedger] = await Promise.all([
    db.select().from(users).where(eq(users.id, user.id)).then(r => r[0] ?? null),
    getCreditBalance(user.id),
    db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED', 'COMPLETED')`,
          gte(teeTimeSlots.date, firstOfMonthStr)
        )
      )
      .then(r => r[0]),
    db
      .select({ count: countDistinct(bookings.courseId) })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED', 'COMPLETED')`,
          gte(teeTimeSlots.date, firstOfMonthStr)
        )
      )
      .then(r => r[0]),
    db
      .select({
        date: teeTimeSlots.date,
        startTime: teeTimeSlots.startTime,
        courseName: courses.name,
      })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .innerJoin(courses, eq(bookings.courseId, courses.id))
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED')`,
          gte(teeTimeSlots.date, today)
        )
      )
      .orderBy(asc(teeTimeSlots.date), asc(teeTimeSlots.startTime))
      .limit(1)
      .then(r => r[0] ?? null),
    db
      .select({
        id: creditLedger.id,
        type: creditLedger.type,
        notes: creditLedger.notes,
        referenceId: creditLedger.referenceId,
        amount: creditLedger.amount,
        createdAt: creditLedger.createdAt,
      })
      .from(creditLedger)
      .where(eq(creditLedger.userId, user.id))
      .orderBy(desc(creditLedger.createdAt))
      .limit(5),
  ])

  const firstName = dbUser?.fullName?.split(' ')[0] ?? 'there'
  const tierKey = (dbUser?.subscriptionTier ?? 'casual') as keyof typeof TIER_CREDITS
  const tierMax = TIER_CREDITS[tierKey] ?? 100
  const roundsThisMonth = monthRoundsResult?.count ?? 0
  const coursesVisited = coursesVisitedResult?.count ?? 0

  const hour = now.getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const greeting = `Good ${timeOfDay}, ${firstName}.`

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase()

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const creditResetLabel = `resets ${nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  let nextTeeCountdown = '—'
  let nextTeeDetails = 'No rounds booked'
  let nextTeeCourse = ''
  if (nextTeeTimeResult) {
    const slotDate = new Date(`${nextTeeTimeResult.date}T${nextTeeTimeResult.startTime}`)
    const diffMs = slotDate.getTime() - Date.now()
    if (diffMs > 0) {
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      nextTeeCountdown = diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours}h`
      nextTeeDetails = slotDate.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
      nextTeeCourse = nextTeeTimeResult.courseName
    }
  }

  return (
    <>
      {/* ── Hero zone ── */}
      <FadeIn>
        <div className="lab-hero">
          <div className="lab-date">{formattedDate}</div>
          <h1 className="lab-greeting">{greeting}</h1>
        </div>
      </FadeIn>

      {/* ── Stats strip ── */}
      <div className="lab-stats">
        {[
          { label: 'Credits', value: String(balance), amber: true, sm: false, sub: [`/ ${tierMax}`, creditResetLabel] },
          { label: 'Rounds', value: String(roundsThisMonth), amber: false, sm: false, sub: ['this month'] },
          { label: 'Courses', value: String(coursesVisited), amber: false, sm: false, sub: ['visited'] },
          { label: 'Next Tee Time', value: nextTeeCountdown, amber: true, sm: true, sub: [nextTeeDetails, nextTeeCourse].filter(Boolean) },
        ].map((stat, i) => (
          <FadeIn key={stat.label} delay={0.1 + i * 0.1}>
            <div className="lab-stat">
              <div className="lab-stat-label">{stat.label}</div>
              <div className={`lab-stat-value${stat.amber ? ' lab-amber' : ''}${stat.sm ? ' lab-stat-sm' : ''}`}>
                {stat.value}
              </div>
              {stat.sub.map((s, j) => (
                <div key={j} className="lab-stat-sub">{s}</div>
              ))}
            </div>
          </FadeIn>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="lab-divider" />

      {/* ── Activity feed ── */}
      <div className="lab-section">
        <div className="lab-section-hd">
          <span className="lab-section-title">Recent Activity</span>
          <Link href="/rounds" className="lab-section-link">View all →</Link>
        </div>
        <div className="lab-activity-card">
          {recentLedger.length === 0 ? (
            <div className="lab-activity-empty">No activity yet.</div>
          ) : (
            recentLedger.map((entry, i) => {
              const isCredit = entry.amount > 0
              const { title, sub } = getLedgerLabel({ type: entry.type, notes: entry.notes, referenceId: entry.referenceId })
              const dateLabel = new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <FadeIn key={entry.id} delay={0.05 * i}>
                  <div>
                    {i > 0 && <div className="lab-activity-divider" />}
                    <div className="lab-activity-row">
                      <div className="lab-activity-main">
                        <div className="lab-activity-title">{title}</div>
                        <div className="lab-activity-sub">{sub}</div>
                      </div>
                      <div className={`lab-activity-amount ${isCredit ? 'lab-amt-credit' : 'lab-amt-debit'}`}>
                        {isCredit ? '+' : ''}{entry.amount} cr.
                      </div>
                      <div className="lab-activity-date">{dateLabel}</div>
                    </div>
                  </div>
                </FadeIn>
              )
            })
          )}
        </div>
      </div>

      {/* ── AI Search ── */}
      <div className="lab-section">
        <div className="lab-section-hd">
          <span className="lab-section-title">Find a Tee Time</span>
          <span className="lab-ai-badge">Beta</span>
        </div>
        <div className="lab-search-row">
          <input
            className="lab-search-input"
            type="text"
            placeholder={'e.g. "Saturday morning at Torrey Pines, 2 players"'}
            readOnly
          />
          <button className="lab-search-btn">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="9" r="6" />
              <line x1="14" y1="14" x2="18" y2="18" />
            </svg>
            Search
          </button>
        </div>
        <div className="lab-search-hints">
          <span className="lab-hint-chip">Tomorrow, 8am</span>
          <span className="lab-hint-chip">Within 20 miles</span>
          <span className="lab-hint-chip">2 players</span>
          <span className="lab-hint-chip">Weekday morning</span>
        </div>
      </div>

      <style>{`
        /* Hero */
        .lab-hero { padding: 80px 36px 48px; }
        .lab-date {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #847C72; margin-bottom: 12px;
          font-family: 'Inter', sans-serif;
        }
        .lab-greeting {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900; font-size: 48px; letter-spacing: -0.025em;
          color: #F4EEE3; line-height: 1.05; margin: 0;
        }

        /* Stats */
        .lab-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; padding: 0 36px 48px; }
        .lab-stat { display: flex; flex-direction: column; }
        .lab-stat-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #847C72; margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
        }
        .lab-stat-value {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900; font-size: 64px; letter-spacing: -0.03em;
          color: #F4EEE3; line-height: 1; margin-bottom: 6px;
        }
        .lab-stat-value.lab-amber { color: #BF7B2E; }
        .lab-stat-value.lab-stat-sm { font-size: 48px; }
        .lab-stat-sub { font-size: 12px; color: #847C72; font-family: 'Inter', sans-serif; line-height: 1.5; }

        /* Divider */
        .lab-divider { height: 1px; background: rgba(229,221,211,0.06); margin: 0 36px; }

        /* Sections */
        .lab-section { padding: 28px 36px 0; }
        .lab-section-hd { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
        .lab-section-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #847C72; font-family: 'Inter', sans-serif;
        }
        .lab-section-link {
          font-size: 11px; font-weight: 600; color: #847C72;
          text-decoration: none; transition: color 0.15s; font-family: 'Inter', sans-serif;
        }
        .lab-section-link:hover { color: #BF7B2E; }

        /* Activity */
        .lab-activity-card { background: #1E1D1B; border: 1px solid rgba(244,238,227,0.06); }
        .lab-activity-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; transition: background 0.12s;
        }
        .lab-activity-row:hover { background: rgba(244,238,227,0.03); }
        .lab-activity-main { flex: 1; }
        .lab-activity-title { font-size: 13px; font-weight: 600; color: #F4EEE3; margin-bottom: 2px; font-family: 'Inter', sans-serif; }
        .lab-activity-sub { font-size: 11px; color: #847C72; font-family: 'Inter', sans-serif; }
        .lab-activity-amount { font-size: 13px; font-weight: 700; font-family: var(--font-geist-mono), 'Geist Mono', monospace; }
        .lab-amt-credit { color: #BF7B2E; }
        .lab-amt-debit { color: #847C72; }
        .lab-activity-date { font-size: 11px; color: #847C72; width: 56px; text-align: right; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .lab-activity-divider { height: 1px; background: rgba(244,238,227,0.06); margin: 0 18px; }
        .lab-activity-empty { padding: 20px 18px; font-size: 13px; color: #847C72; text-align: center; font-family: 'Inter', sans-serif; }

        /* AI Search */
        .lab-ai-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 0.08em; color: #BF7B2E;
          background: rgba(191,123,46,0.10); border: 1px solid rgba(191,123,46,0.18);
          border-radius: 2px; padding: 2px 7px; text-transform: uppercase; font-family: 'Inter', sans-serif;
        }
        .lab-search-row { display: flex; gap: 8px; }
        .lab-search-input {
          flex: 1; background: #1E1D1B; border: 1px solid rgba(229,221,211,0.06);
          border-radius: 2px; padding: 12px 16px; font-family: 'Inter', sans-serif;
          font-size: 13px; color: #F4EEE3; outline: none;
        }
        .lab-search-input::placeholder { color: #847C72; }
        .lab-search-btn {
          background: #BF7B2E; border: none; border-radius: 2px; padding: 0 20px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; color: #0C0C0B; text-transform: uppercase;
          cursor: pointer; display: flex; align-items: center; gap: 7px; transition: background 0.15s;
        }
        .lab-search-btn:hover { background: #d48c37; }
        .lab-search-hints { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; padding-bottom: 48px; }
        .lab-hint-chip {
          font-size: 10px; font-weight: 500; color: #847C72; background: #1E1D1B;
          border: 1px solid rgba(244,238,227,0.08); border-radius: 2px;
          padding: 1px 6px; font-family: 'Inter', sans-serif;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .lab-hero { padding: 40px 24px 32px; }
          .lab-greeting { font-size: 36px; }
          .lab-stats { grid-template-columns: repeat(2, 1fr); gap: 32px; padding: 0 24px 32px; }
          .lab-stat-value { font-size: 48px; }
          .lab-stat-value.lab-stat-sm { font-size: 40px; }
          .lab-divider { margin: 0 24px; }
          .lab-section { padding: 20px 24px 0; }
        }
        @media (max-width: 640px) {
          .lab-hero { padding: 32px 20px 24px; }
          .lab-greeting { font-size: 32px; }
          .lab-stats { grid-template-columns: repeat(2, 1fr); gap: 24px; padding: 0 20px 24px; }
          .lab-stat-value { font-size: 48px; }
          .lab-stat-value.lab-stat-sm { font-size: 36px; }
          .lab-divider { margin: 0 20px; }
          .lab-section { padding: 16px 20px 0; }
        }
      `}</style>
    </>
  )
}
