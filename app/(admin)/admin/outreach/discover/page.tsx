import type { Metadata } from 'next'
import DiscoverForm from './discover-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Discover Courses — Gimmelab Admin' }

export default function OutreachDiscoverPage() {
  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--linen)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>
          Discover Courses
        </h1>
        <p style={{ fontSize: 14, color: 'var(--stone)' }}>
          Enter a location and radius to find golf courses via Google Places. Select the ones you want to prospect and add them to your list.
        </p>
      </div>
      <DiscoverForm />
    </div>
  )
}
