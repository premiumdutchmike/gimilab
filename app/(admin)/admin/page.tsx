import { createClient } from '@/lib/supabase/server'
import {
  getAdminDashboardStats,
  getRecentMembersWithStats,
  getRecentBookingsActivity,
  getCreditHealthStats,
  getTopCourses,
} from '@/lib/admin/queries'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard — Gimmelab Admin' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [dashStats, recentMembers, recentBookings, creditHealth, topCourses] = await Promise.all([
    getAdminDashboardStats(),
    getRecentMembersWithStats(),
    getRecentBookingsActivity(),
    getCreditHealthStats(),
    getTopCourses(),
  ])

  // Derived values
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Admin'
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const greeting = `Good ${timeOfDay}, ${firstName}.`

  // MRR formatting
  const mrrDollars = dashStats.mrrCents / 100
  const mrrFormatted = mrrDollars >= 1000 ? `$${(mrrDollars / 1000).toFixed(1)}k` : `$${mrrDollars.toLocaleString()}`

  // Breakage
  const breakagePct = dashStats.grantedCredits > 0
    ? Math.round((dashStats.expiredCredits / dashStats.grantedCredits) * 1000) / 10
    : 0

  // Rounds delta
  const roundsDelta = dashStats.roundsThisMonth - dashStats.roundsPriorMonth

  // Relative time helper
  function timeAgo(date: Date): string {
    const ms = Date.now() - new Date(date).getTime()
    const hours = Math.floor(ms / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  return (
    <div className="adm-wrap">
      {/* Greeting */}
      <div className="adm-greeting">{greeting}</div>

      {/* Hero Stats */}
      <div className="adm-stats-card">
        {[
          { label: 'Members', value: dashStats.activeMembers.toLocaleString(), delta: `+${dashStats.newMembersThisMonth} this month`, amber: false },
          { label: 'MRR', value: mrrFormatted, delta: null, amber: true },
          { label: 'Rounds Booked', value: dashStats.roundsThisMonth.toLocaleString(), delta: `${roundsDelta >= 0 ? '+' : ''}${roundsDelta} this month`, amber: false },
          { label: 'Credit Breakage', value: `${breakagePct}%`, delta: 'Credits expired unused', amber: false },
          { label: 'Active Courses', value: String(dashStats.activeCourses), delta: `${dashStats.pendingCourses} pending review`, amber: false },
        ].map((stat) => (
          <div key={stat.label} className="adm-stat-cell">
            <div className="adm-stat-label">{stat.label}</div>
            <div className={`adm-stat-value${stat.amber ? ' adm-amber' : ''}`}>{stat.value}</div>
            {stat.delta && <div className="adm-stat-delta">{stat.delta}</div>}
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="adm-grid">
        {/* Left: Recent Members */}
        <div className="adm-card">
          <div className="adm-card-hd">Recent Members</div>
          <div className="adm-table-head">
            <span style={{ flex: 1 }}>Name</span>
            <span style={{ width: 70 }}>Tier</span>
            <span style={{ width: 90 }}>Credits</span>
            <span style={{ width: 60 }}>Rounds</span>
            <span style={{ width: 50 }}>Status</span>
            <span style={{ width: 70, textAlign: 'right' }}>Joined</span>
          </div>
          {recentMembers.map(m => {
            const tierMax = m.subscriptionTier === 'heavy' ? 210 : m.subscriptionTier === 'core' ? 150 : 100
            const tierColor = m.subscriptionTier === 'core' ? '#BF7B2E' : '#F4EEE3'
            const statusColor = m.subscriptionStatus === 'active' ? '#BF7B2E' : m.subscriptionStatus === 'past_due' ? '#d97706' : '#847C72'
            const joined = new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            return (
              <a key={m.id} href={`/admin/members/${m.id}`} className="adm-table-row">
                <span style={{ flex: 1, fontWeight: 600, color: '#F4EEE3' }}>{m.fullName ?? '\u2014'}</span>
                <span style={{ width: 70, color: tierColor, textTransform: 'capitalize' }}>{m.subscriptionTier ?? '\u2014'}</span>
                <span style={{ width: 90 }}>{Number(m.balance)} / {tierMax}</span>
                <span style={{ width: 60 }}>{Number(m.totalRounds)}</span>
                <span style={{ width: 50 }}><span className="adm-dot" style={{ background: statusColor }} /></span>
                <span style={{ width: 70, textAlign: 'right', color: '#847C72' }}>{joined}</span>
              </a>
            )
          })}
        </div>

        {/* Right column */}
        <div className="adm-right">
          {/* Pending Courses */}
          <div className="adm-card" style={{ marginBottom: 24 }}>
            <div className="adm-card-hd">Pending</div>
            <div className="adm-pending-num">{dashStats.pendingCourses}</div>
            <a href="/admin/courses" className="adm-pending-link">Review &rarr;</a>
          </div>

          {/* Activity */}
          <div>
            <div className="adm-card-hd">Activity</div>
            {recentBookings.length === 0 ? (
              <div style={{ color: '#847C72', fontSize: 13 }}>No recent bookings.</div>
            ) : (
              recentBookings.map(b => {
                const name = b.memberName?.split(' ')[0] ?? 'Member'
                const time = b.startTime?.slice(0, 5) ?? ''
                return (
                  <div key={b.bookingId} className="adm-activity-row">
                    <span className="adm-dot" style={{ background: '#BF7B2E', marginTop: 5 }} />
                    <div>
                      <div className="adm-activity-text">{name} booked {b.courseName} &mdash; {time}</div>
                      <div className="adm-activity-time">{timeAgo(b.createdAt)}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom 3-column */}
      <div className="adm-bottom">
        {/* Members by Tier */}
        <div className="adm-card">
          <div className="adm-card-hd">Members by Tier</div>
          {(['casual', 'core', 'heavy'] as const).map(tier => {
            const count = dashStats.tierMap[tier] ?? 0
            const pct = dashStats.activeMembers > 0 ? Math.round((count / dashStats.activeMembers) * 100) : 0
            const price = tier === 'casual' ? '$99/mo' : tier === 'core' ? '$149/mo' : '$199/mo'
            const color = tier === 'core' ? '#BF7B2E' : '#F4EEE3'
            return (
              <div key={tier} className="adm-tier-row">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color, textTransform: 'capitalize' }}>{tier}</div>
                  <div style={{ fontSize: 11, color: '#847C72' }}>{pct}% &middot; {price}</div>
                </div>
                <div className="adm-tier-num">{count}</div>
              </div>
            )
          })}
        </div>

        {/* Credit Health */}
        <div className="adm-card">
          <div className="adm-card-hd">Credit Health</div>
          {[
            { label: 'Avg credits used', value: `${creditHealth.avgCreditsUsedPct}%` },
            { label: 'Breakage rate', value: `${creditHealth.breakageRatePct}%` },
            { label: 'Rollover live', value: creditHealth.rolloverLive.toLocaleString() },
            { label: 'Avg rounds / member', value: String(creditHealth.avgRoundsPerMember) },
          ].map(row => (
            <div key={row.label} className="adm-health-row">
              <span>{row.label}</span>
              <span className="adm-health-val">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Top Courses */}
        <div className="adm-card">
          <div className="adm-card-hd">Top Partner Courses</div>
          {topCourses.map(c => (
            <div key={c.courseId} className="adm-course-row">
              <span>{c.courseName}</span>
              <span className="adm-course-num">{Number(c.totalBookings)}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .adm-wrap {
          background: #0C0C0B;
          min-height: 100vh;
          padding: 32px 36px 48px;
          max-width: 1280px;
          margin: 0 auto;
          font-family: 'Inter', sans-serif;
        }
        .adm-greeting {
          font-family: var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 800;
          font-size: 28px;
          letter-spacing: -0.03em;
          color: #F4EEE3;
          margin-bottom: 28px;
        }

        /* Hero Stats */
        .adm-stats-card {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          background: #1E1D1B;
          border: 1px solid rgba(244,238,227,0.06);
          margin-bottom: 32px;
        }
        .adm-stat-cell {
          padding: 24px 24px;
          border-right: 1px solid rgba(244,238,227,0.06);
        }
        .adm-stat-cell:last-child { border-right: none; }
        .adm-stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #847C72;
          margin-bottom: 12px;
        }
        .adm-stat-value {
          font-family: var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 900;
          font-size: 56px;
          letter-spacing: -0.04em;
          color: #F4EEE3;
          line-height: 0.9;
          margin-bottom: 8px;
        }
        .adm-stat-value.adm-amber { color: #BF7B2E; }
        .adm-stat-delta {
          font-size: 12px;
          color: #847C72;
        }

        /* Cards */
        .adm-card {
          background: #1E1D1B;
          border: 1px solid rgba(244,238,227,0.06);
          padding: 24px;
        }
        .adm-card-hd {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #847C72;
          margin-bottom: 16px;
        }

        /* Content Grid */
        .adm-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          margin-bottom: 24px;
        }

        /* Table */
        .adm-table-head {
          display: flex;
          align-items: center;
          padding: 0 0 10px;
          border-bottom: 1px solid rgba(244,238,227,0.06);
          margin-bottom: 4px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #847C72;
        }
        .adm-table-row {
          display: flex;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(244,238,227,0.04);
          font-size: 13px;
          color: #F4EEE3;
          text-decoration: none;
          transition: background 0.1s;
        }
        .adm-table-row:hover { background: rgba(244,238,227,0.02); }
        .adm-table-row:last-child { border-bottom: none; }

        /* Dot */
        .adm-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Right column */
        .adm-right { display: flex; flex-direction: column; }
        .adm-pending-num {
          font-family: var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 900;
          font-size: 48px;
          letter-spacing: -0.04em;
          color: #F4EEE3;
          line-height: 1;
          margin-bottom: 8px;
        }
        .adm-pending-link {
          font-size: 12px;
          font-weight: 600;
          color: #BF7B2E;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .adm-pending-link:hover { opacity: 0.75; }

        /* Activity */
        .adm-activity-row {
          display: flex;
          gap: 10px;
          padding: 8px 0;
        }
        .adm-activity-text {
          font-size: 13px;
          color: #F4EEE3;
          font-weight: 500;
          line-height: 1.4;
        }
        .adm-activity-time {
          font-size: 11px;
          color: #847C72;
          margin-top: 2px;
        }

        /* Bottom */
        .adm-bottom {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .adm-tier-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(244,238,227,0.04);
        }
        .adm-tier-row:last-child { border-bottom: none; }
        .adm-tier-num {
          font-family: var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 900;
          font-size: 36px;
          letter-spacing: -0.04em;
          color: #F4EEE3;
          line-height: 1;
        }
        .adm-health-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(244,238,227,0.04);
          font-size: 13px;
          color: #F4EEE3;
        }
        .adm-health-row:last-child { border-bottom: none; }
        .adm-health-val {
          font-family: var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 900;
          font-size: 28px;
          letter-spacing: -0.04em;
          color: #F4EEE3;
          line-height: 1;
        }
        .adm-course-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(244,238,227,0.04);
          font-size: 13px;
          color: #F4EEE3;
        }
        .adm-course-row:last-child { border-bottom: none; }
        .adm-course-num {
          font-family: var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 900;
          font-size: 20px;
          letter-spacing: -0.03em;
          color: #F4EEE3;
        }

        @media (max-width: 1100px) {
          .adm-stats-card { grid-template-columns: repeat(3, 1fr); }
          .adm-grid { grid-template-columns: 1fr; }
          .adm-bottom { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
