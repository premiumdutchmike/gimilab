import { getAdminStats, getAdminMembers } from '@/lib/admin/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Members — Gimmelab Admin' }

const TIER_COLOR: Record<string, string> = {
  casual: '#0ea5e9',
  core:   '#a855f7',
  heavy:  '#16a34a',
}

const SUB_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  past_due:  { label: 'Past due',  color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminMembersPage() {
  let stats: Awaited<ReturnType<typeof getAdminStats>>
  let members: Awaited<ReturnType<typeof getAdminMembers>>
  try {
    ;[stats, members] = await Promise.all([getAdminStats(), getAdminMembers()])
  } catch (e: unknown) {
    const msg = e instanceof Error
      ? `${e.message}\n\nCause: ${(e as NodeJS.ErrnoException & { cause?: unknown }).cause ?? 'none'}\n\nStack: ${e.stack}`
      : String(e)
    return <pre style={{ padding: 40, color: '#ef4444', whiteSpace: 'pre-wrap', fontSize: 11 }}>{msg}</pre>
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 24 }}>
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
            <div key={label} style={{ background: '#fff', border: '1px solid #e8e8e8', padding: '18px 20px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
                {label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
        {/* Head */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px',
          padding: '10px 20px', borderBottom: '1px solid #e8e8e8',
          background: '#fafafa',
        }}>
          {['Member', 'Plan', 'Status', 'Joined'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>
              {h}
            </span>
          ))}
        </div>

        {members.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>
            No members yet.
          </div>
        ) : (
          members.map((m, i) => {
            const status = m.subscriptionStatus ? SUB_STATUS[m.subscriptionStatus] : null
            const tierColor = m.subscriptionTier ? TIER_COLOR[m.subscriptionTier] : 'rgba(0,0,0,0.2)'
            return (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px',
                padding: '13px 20px', alignItems: 'center',
                borderBottom: i < members.length - 1 ? '1px solid #f0f0f0' : 'none',
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
                    padding: '3px 8px', borderRadius: 2,
                  }}>
                    {status.label}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.2)' }}>—</span>
                )}
                <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>
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
