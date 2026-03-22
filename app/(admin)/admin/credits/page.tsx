import { getAdminMembersWithCredits } from '@/lib/admin/queries'
import CreditGrantForm from './credit-grant-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Credits — Gimmelab Admin' }

const TIER_COLOR: Record<string, string> = {
  casual: '#0ea5e9',
  core:   '#a855f7',
  heavy:  '#16a34a',
}

export default async function AdminCreditsPage() {
  const members = await getAdminMembersWithCredits()

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>
          Credits
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>
          Adjust credit balances per member. Use positive amounts to grant, negative to deduct.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 140px 100px 120px 280px',
          padding: '10px 20px', borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
        }}>
          {['Member', 'Plan', 'Status', 'Balance', 'Adjustment'].map(h => (
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
            const tierColor = m.subscriptionTier ? TIER_COLOR[m.subscriptionTier] : 'rgba(0,0,0,0.2)'
            const balance = Number(m.balance)
            return (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 100px 120px 280px',
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
                <span style={{ fontSize: 11, color: m.subscriptionStatus === 'active' ? '#16a34a' : 'rgba(0,0,0,0.3)', textTransform: 'capitalize' }}>
                  {m.subscriptionStatus ?? '—'}
                </span>
                <span style={{
                  fontSize: 15, fontWeight: 900, letterSpacing: '-0.03em',
                  color: balance > 0 ? '#111' : balance < 0 ? '#dc2626' : 'rgba(0,0,0,0.3)',
                }}>
                  {balance} <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(0,0,0,0.3)' }}>cr</span>
                </span>
                <CreditGrantForm userId={m.id} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
