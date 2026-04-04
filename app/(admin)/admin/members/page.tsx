import { getAdminStats, getAdminMembers } from '@/lib/admin/queries'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Members — Gimmelab Admin' }

const TIER_COLOR: Record<string, string> = {
  casual: 'rgba(0,0,0,0.5)',
  core:   '#BF7B2E',
  heavy:  '#111',
}

const SUB_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#BF7B2E', bg: 'rgba(191,123,46,0.08)' },
  past_due:  { label: 'Past due',  color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  cancelled: { label: 'Cancelled', color: '#847C72', bg: 'rgba(132,124,114,0.08)' },
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const GEIST = "var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif"

export default async function AdminMembersPage() {
  const [stats, members] = await Promise.all([getAdminStats(), getAdminMembers()])

  return (
    <div style={{ padding: '32px 28px 48px', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <h1 style={{ fontFamily: GEIST, fontSize: 28, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 28 }}>
        Members
      </h1>

      {/* Stat strip — single bordered card like dashboard */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: '#fff', border: '1px solid #e8e8e8',
        marginBottom: 32,
      }}>
        {[
          { label: 'Total members',        value: stats.memberCount.toLocaleString() },
          { label: 'Active subscriptions', value: stats.activeSubCount.toLocaleString() },
          { label: 'Pending courses',      value: String(stats.pendingCourseCount) },
          { label: 'Total payouts',        value: `$${(stats.totalRevenueCents / 100).toLocaleString()}` },
        ].map(({ label, value }, i) => (
          <div key={label} style={{
            padding: '24px 24px',
            borderRight: i < 3 ? '1px solid #e8e8e8' : 'none',
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 12 }}>
              {label}
            </p>
            <p style={{ fontFamily: GEIST, fontSize: 48, fontWeight: 900, color: '#111', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px',
          padding: '12px 24px', borderBottom: '1px solid #e8e8e8',
        }}>
          {['Member', 'Plan', 'Status', 'Joined'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>
              {h}
            </span>
          ))}
        </div>

        {members.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(0,0,0,0.35)', fontSize: 13 }}>
            No members yet.
          </div>
        ) : (
          members.map((m, i) => {
            const status = m.subscriptionStatus ? SUB_STATUS[m.subscriptionStatus] : null
            const tierColor = m.subscriptionTier ? TIER_COLOR[m.subscriptionTier] : 'rgba(0,0,0,0.2)'
            return (
              <a key={m.id} href={`/admin/members/${m.id}`} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px',
                padding: '14px 24px', alignItems: 'center',
                borderBottom: i < members.length - 1 ? '1px solid #f0f0f0' : 'none',
                textDecoration: 'none', transition: 'background 0.1s',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                    {m.fullName ?? '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{m.email}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: tierColor, textTransform: 'capitalize' }}>
                  {m.subscriptionTier ?? 'No plan'}
                </span>
                {status ? (
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: status.color, background: status.bg,
                    padding: '3px 8px', borderRadius: 2, width: 'fit-content',
                  }}>
                    {status.label}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.2)' }}>—</span>
                )}
                <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>
                  {formatDate(m.createdAt)}
                </span>
              </a>
            )
          })
        )}
      </div>
    </div>
  )
}
