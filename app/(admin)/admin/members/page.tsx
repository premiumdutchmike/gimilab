import { getAdminStats, getAdminMembers } from '@/lib/admin/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Members — Gimmelab Admin' }

const TIER_COLOR: Record<string, string> = {
  casual: '#38bdf8',
  core:   '#a855f7',
  heavy:  '#4ade80',
}

const SUB_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#4ade80', bg: 'rgba(74,222,128,0.10)' },
  past_due:  { label: 'Past due',  color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
  cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminMembersPage() {
  const [stats, members] = await Promise.all([getAdminStats(), getAdminMembers()])

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 24 }}>
          Members
        </h1>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          {[
            { label: 'Total members',       value: stats.memberCount },
            { label: 'Active subscriptions', value: stats.activeSubCount },
            { label: 'Pending courses',      value: stats.pendingCourseCount },
            { label: 'Total payouts',        value: `$${(stats.totalRevenueCents / 100).toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '18px 20px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                {label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#141414', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
        {/* Head */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px',
          padding: '10px 20px', borderBottom: '1px solid #1f1f1f',
        }}>
          {['Member', 'Plan', 'Status', 'Joined'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
              {h}
            </span>
          ))}
        </div>

        {members.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            No members yet.
          </div>
        ) : (
          members.map((m, i) => {
            const status = m.subscriptionStatus ? SUB_STATUS[m.subscriptionStatus] : null
            const tierColor = m.subscriptionTier ? TIER_COLOR[m.subscriptionTier] : 'rgba(255,255,255,0.2)'
            return (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px',
                padding: '13px 20px', alignItems: 'center',
                borderBottom: i < members.length - 1 ? '1px solid #1f1f1f' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                    {m.fullName ?? '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{m.email}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: tierColor, textTransform: 'capitalize' }}>
                  {m.subscriptionTier ?? 'No plan'}
                </span>
                {status ? (
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: status.color, background: status.bg,
                    padding: '3px 8px', borderRadius: 2,
                  }}>
                    {status.label}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>—</span>
                )}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {formatDate(m.createdAt)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
