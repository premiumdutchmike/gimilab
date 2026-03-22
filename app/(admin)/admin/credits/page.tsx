import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Credits — Gimmelab Admin' }

export default function AdminCreditsPage() {
  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 24 }}>
        Credits
      </h1>
      <div style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Credit management — coming in Sprint 3.</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Will support admin adjustments, bonus grants, and expiry overrides per member.</p>
      </div>
    </div>
  )
}
