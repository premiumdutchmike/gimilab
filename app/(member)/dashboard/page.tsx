import { redirect } from 'next/navigation'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users, bookings, teeTimeSlots, creditLedger } from '@/lib/db/schema'
import { and, eq, gt, count, desc, sql } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — gimilab' }

function getGreeting(firstName: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${firstName}.`
  if (hour < 17) return `Good afternoon, ${firstName}.`
  return `Good evening, ${firstName}.`
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getCreditResetDate(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return `resets ${nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function getMemberSinceLabel(createdAt: Date | null): string {
  if (!createdAt) return '—'
  return createdAt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function getMemberMonths(createdAt: Date | null): string {
  if (!createdAt) return ''
  const months = Math.round(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.5)
  )
  return `${months} month${months !== 1 ? 's' : ''}`
}

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
    default:
      return { title: 'Credit event', sub: entry.type }
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  firstOfMonth.setHours(0, 0, 0, 0)

  const [dbUser, balance, upcomingResult, monthRoundsResult, recentLedger] = await Promise.all([
    db.select().from(users).where(eq(users.id, user.id)).then(r => r[0] ?? null),
    getCreditBalance(user.id),
    db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED')`,
          gt(teeTimeSlots.date, today)
        )
      )
      .then(r => r[0]),
    db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED', 'COMPLETED')`,
          gt(sql`${teeTimeSlots.date}`, firstOfMonth.toISOString().split('T')[0])
        )
      )
      .then(r => r[0]),
    db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.userId, user.id))
      .orderBy(desc(creditLedger.createdAt))
      .limit(5),
  ])

  const firstName = dbUser?.fullName?.split(' ')[0] ?? 'there'
  const tierName = dbUser?.subscriptionTier ?? null
  const memberSince = getMemberSinceLabel(dbUser?.createdAt ?? null)
  const memberMonths = getMemberMonths(dbUser?.createdAt ?? null)
  const roundsThisMonth = monthRoundsResult?.count ?? 0
  const greeting = getGreeting(firstName)
  const formattedDate = getFormattedDate()
  const creditResetDate = getCreditResetDate()
  const creditPct = Math.min(100, (balance / (tierName === 'heavy' ? 210 : tierName === 'core' ? 150 : 100)) * 100)

  return (
    <>
      {/* ── Topbar ── */}
      <header className="dash-topbar">
        <div className="topbar-greeting">
          <span className="greeting-text">{greeting}</span>
          <span className="greeting-date">{formattedDate}</span>
        </div>
        <div className="topbar-right">
          <div className="credit-chip">
            <span className="credit-val">{balance}</span>
            <div className="credit-meta">
              <span>Credits</span>
              <span>{creditResetDate}</span>
            </div>
          </div>
          <Link href="/courses" className="book-btn">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="14" height="14" rx="1" />
              <line x1="7" y1="2" x2="7" y2="6" />
              <line x1="13" y1="2" x2="13" y2="6" />
              <line x1="3" y1="9" x2="17" y2="9" />
            </svg>
            Book Tee Time
          </Link>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="dash-content">

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card stat-primary">
            <div className="stat-label">Credits Available</div>
            <div className="stat-value stat-amber">{balance}</div>
            <div className="stat-sub">{creditResetDate}</div>
            <div className="stat-bar-track">
              <div className="stat-bar-fill" style={{ width: `${creditPct}%` }} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rounds This Month</div>
            <div className="stat-value">{roundsThisMonth}</div>
            <div className="stat-sub">{roundsThisMonth === 1 ? '1 round played' : `${roundsThisMonth} rounds played`}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Member Since</div>
            <div className="stat-value" style={{ fontSize: 22, marginTop: 6 }}>{memberSince}</div>
            <div className="stat-sub">{memberMonths}</div>
          </div>
        </div>

        {/* AI Search */}
        <div className="section-wrap">
          <div className="section-hd">
            <span className="section-title">Find a Tee Time</span>
          </div>
          <div className="search-box">
            <div className="search-label-row">
              <span className="search-label">AI Booking Search</span>
              <span className="ai-badge">Beta</span>
            </div>
            <div className="search-input-row">
              <input
                className="search-input"
                type="text"
                placeholder={'e.g. "Saturday morning at Torrey Pines, 2 players"'}
                readOnly
              />
              <button className="search-submit">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="9" cy="9" r="6" />
                  <line x1="14" y1="14" x2="18" y2="18" />
                </svg>
                Search
              </button>
            </div>
            <div className="search-hint">
              Try: <em>Tomorrow, 8am</em> <em>Within 20 miles</em> <em>2 players</em>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-wrap">
          <div className="section-hd">
            <span className="section-title">Quick Actions</span>
          </div>
          <div className="actions-grid">
            <Link href="/courses" className="action-card">
              <div>
                <div className="action-icon">
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="3" y="4" width="14" height="14" rx="1" />
                    <line x1="7" y1="2" x2="7" y2="6" />
                    <line x1="13" y1="2" x2="13" y2="6" />
                    <line x1="3" y1="9" x2="17" y2="9" />
                  </svg>
                </div>
                <div className="action-title">Book a Tee Time</div>
                <div className="action-desc">Browse available tee times and book with your credits.</div>
              </div>
              <span className="action-badge">1–2 cr.</span>
            </Link>
            <Link href="/courses" className="action-card">
              <div>
                <div className="action-icon">
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M10 2C7.24 2 5 4.24 5 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5Z" />
                    <circle cx="10" cy="7" r="1.8" />
                  </svg>
                </div>
                <div className="action-title">Browse Courses</div>
                <div className="action-desc">Explore all member courses — details and availability.</div>
              </div>
            </Link>
            <Link href="/rounds" className="action-card">
              <div>
                <div className="action-icon">
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <line x1="5" y1="2" x2="5" y2="18" />
                    <path d="M5 4h9l-2 4 2 4H5" />
                  </svg>
                </div>
                <div className="action-title">My Rounds</div>
                <div className="action-desc">View upcoming tee times and past booking history.</div>
              </div>
            </Link>
            <Link href="/credits" className="action-card">
              <div>
                <div className="action-icon">
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="10" cy="10" r="7.5" />
                    <path d="M10 7v6M8.5 8.5h2.5a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2H11" />
                  </svg>
                </div>
                <div className="action-title">Credits</div>
                <div className="action-desc">Check your balance, usage history, and plan details.</div>
              </div>
              <span className="action-badge">{balance} left</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section-wrap">
          <div className="section-hd">
            <span className="section-title">Recent Activity</span>
            <Link href="/rounds" className="section-link">View all →</Link>
          </div>
          <div className="activity-list">
            {recentLedger.length === 0 ? (
              <div className="activity-empty">No activity yet — your booking history will appear here.</div>
            ) : (
              recentLedger.map((entry) => {
                const isCredit = entry.amount > 0
                const { title, sub } = getLedgerLabel({ type: entry.type, notes: entry.notes, referenceId: entry.referenceId })
                const dateLabel = new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <div key={entry.id} className="activity-row">
                    <div className={`activity-dot ${isCredit ? 'dot-credit' : 'dot-debit'}`} />
                    <div className="activity-main">
                      <div className="activity-title">{title}</div>
                      <div className="activity-sub">{sub}</div>
                    </div>
                    <div className={`activity-amount ${isCredit ? 'amt-credit' : 'amt-debit'}`}>
                      {isCredit ? '+' : ''}{entry.amount} cr.
                    </div>
                    <div className="activity-date">{dateLabel}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      <style>{`
        .dash-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 36px; border-bottom: 1px solid rgba(12,12,11,0.09);
          background: #fff; position: sticky; top: 0; z-index: 50;
          gap: 20px; font-family: 'Inter', sans-serif;
        }
        .topbar-greeting { display: flex; flex-direction: column; gap: 2px; }
        .greeting-text { font-size: 17px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; }
        .greeting-date { font-size: 12px; color: #847C72; }
        .topbar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .credit-chip {
          display: flex; align-items: center; gap: 10px;
          background: #FDFAF6; border: 1px solid rgba(12,12,11,0.15);
          border-radius: 2px; padding: 10px 16px;
        }
        .credit-val { font-size: 22px; font-weight: 700; color: #BF7B2E; letter-spacing: -0.03em; line-height: 1; }
        .credit-meta { display: flex; flex-direction: column; }
        .credit-meta span:first-child { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #0C0C0B; }
        .credit-meta span:last-child { font-size: 10px; color: #847C72; }
        .book-btn {
          background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px;
          padding: 11px 20px; font-family: 'Inter', sans-serif; font-size: 12px;
          font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
          cursor: pointer; transition: background 0.15s;
        }
        .book-btn:hover { background: #d48c37; }
        .dash-content { flex: 1; padding: 28px 36px 48px; font-family: 'Inter', sans-serif; }
        .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px; }
        .stat-card {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 20px 24px; position: relative; overflow: hidden;
        }
        .stat-card.stat-primary { border-left: 2px solid #BF7B2E; }
        .stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #847C72; margin-bottom: 8px; }
        .stat-value { font-size: 36px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
        .stat-value.stat-amber { color: #BF7B2E; }
        .stat-sub { font-size: 12px; color: #847C72; }
        .stat-bar-track { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: rgba(12,12,11,0.09); }
        .stat-bar-fill { height: 100%; background: #BF7B2E; opacity: 0.6; }
        .section-wrap { margin-bottom: 28px; }
        .section-hd { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
        .section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #847C72; }
        .section-link { font-size: 11px; font-weight: 600; color: #847C72; text-decoration: none; transition: color 0.15s; }
        .section-link:hover { color: #BF7B2E; }
        .search-box { background: #fff; border: 1px solid rgba(12,12,11,0.09); padding: 20px 24px; }
        .search-label-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .search-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #847C72; }
        .ai-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 0.08em; color: #BF7B2E;
          background: rgba(191,123,46,0.10); border: 1px solid rgba(191,123,46,0.18);
          border-radius: 2px; padding: 2px 7px; text-transform: uppercase;
        }
        .search-input-row { display: flex; gap: 8px; }
        .search-input {
          flex: 1; background: #FDFAF6; border: 1px solid rgba(12,12,11,0.15);
          border-radius: 2px; padding: 12px 16px; font-family: 'Inter', sans-serif;
          font-size: 13px; color: #0C0C0B; outline: none;
        }
        .search-input::placeholder { color: #847C72; }
        .search-submit {
          background: #0C0C0B; border: none; border-radius: 2px; padding: 0 20px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; color: #F4EEE3; text-transform: uppercase;
          cursor: pointer; display: flex; align-items: center; gap: 7px;
        }
        .search-hint { margin-top: 8px; font-size: 11px; color: #847C72; }
        .search-hint em {
          font-style: normal; background: #FDFAF6; border: 1px solid rgba(12,12,11,0.09);
          border-radius: 2px; padding: 1px 6px; margin: 0 2px; font-size: 10px; color: #0C0C0B;
        }
        .actions-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        .action-card {
          background: #fff; border: 1px solid rgba(12,12,11,0.09); padding: 22px 24px;
          text-decoration: none; color: #0C0C0B; display: flex;
          align-items: flex-start; justify-content: space-between; gap: 14px;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .action-card:hover { box-shadow: 0 4px 16px rgba(12,12,11,0.07); border-color: rgba(12,12,11,0.15); }
        .action-icon {
          width: 34px; height: 34px; background: #FDFAF6; border: 1px solid rgba(12,12,11,0.09);
          border-radius: 2px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-bottom: 14px; color: #BF7B2E;
        }
        .action-title { font-size: 14px; font-weight: 700; color: #0C0C0B; margin-bottom: 5px; letter-spacing: -0.01em; }
        .action-desc { font-size: 12px; color: #847C72; line-height: 1.5; }
        .action-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: #BF7B2E; background: rgba(191,123,46,0.10); border: 1px solid rgba(191,123,46,0.18);
          border-radius: 2px; padding: 3px 8px; flex-shrink: 0; align-self: flex-start;
        }
        .activity-list { display: flex; flex-direction: column; gap: 2px; }
        .activity-row {
          display: flex; align-items: center; gap: 14px; background: #fff;
          border: 1px solid rgba(12,12,11,0.09); padding: 14px 18px; transition: background 0.12s;
        }
        .activity-row:hover { background: #FDFAF6; }
        .activity-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .activity-dot.dot-credit { background: #BF7B2E; }
        .activity-dot.dot-debit { background: #847C72; opacity: 0.4; }
        .activity-main { flex: 1; }
        .activity-title { font-size: 13px; font-weight: 600; color: #0C0C0B; margin-bottom: 2px; }
        .activity-sub { font-size: 11px; color: #847C72; }
        .activity-amount { font-size: 13px; font-weight: 700; }
        .activity-amount.amt-credit { color: #BF7B2E; }
        .activity-amount.amt-debit { color: #847C72; }
        .activity-date { font-size: 11px; color: #847C72; width: 56px; text-align: right; flex-shrink: 0; }
        .activity-empty { background: #fff; border: 1px solid rgba(12,12,11,0.09); padding: 20px 18px; font-size: 13px; color: #847C72; }
        @media (max-width: 900px) {
          .stats-row { grid-template-columns: 1fr 1fr; }
          .dash-topbar { padding: 16px 24px; }
          .dash-content { padding: 20px 24px 40px; }
        }
        @media (max-width: 640px) {
          .stats-row { grid-template-columns: 1fr; }
          .actions-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
